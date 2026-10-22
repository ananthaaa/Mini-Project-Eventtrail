/**
 * EventTrail GPS-to-Path Matching and Routing Engine
 * 
 * Provides intelligent snapping of inaccurate or noisy raw GPS coordinates
 * to the nearest valid, connected campus walking paths, avoiding disconnected
 * nodes, preventing sudden jumps between distant paths, detecting route
 * deviations, and determining arrival.
 */

import { VENUE_TO_NODE } from '../data/buildings.js';

// ASIET Campus Boundary Coordinates [lng, lat]
export const ASIET_CAMPUS_BOUNDS = {
  minLng: 76.4250,
  maxLng: 76.4355,
  minLat: 10.1730,
  maxLat: 10.1830,
};

const R_EARTH = 6371000; // meters
const CAMPUS_REF_LAT = 10.1780; // center latitude for equirectangular projection
const RAD = Math.PI / 180;
const COS_REF_LAT = Math.cos(CAMPUS_REF_LAT * RAD);

/**
 * Checks if coordinates fall within or near ASIET campus bounds.
 * @param {number} lat 
 * @param {number} lng 
 * @param {number} bufferMeters - extra buffer around compound
 */
export function isWithinCampusBounds(lat, lng, bufferMeters = 100) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return false;
  const dLat = (bufferMeters / R_EARTH) / RAD;
  const dLng = (bufferMeters / (R_EARTH * COS_REF_LAT)) / RAD;

  return (
    lat >= ASIET_CAMPUS_BOUNDS.minLat - dLat &&
    lat <= ASIET_CAMPUS_BOUNDS.maxLat + dLat &&
    lng >= ASIET_CAMPUS_BOUNDS.minLng - dLng &&
    lng <= ASIET_CAMPUS_BOUNDS.maxLng + dLng
  );
}

/**
 * Converts (lat, lng) to local Cartesian meters [x, y] relative to reference point.
 */
export function toMeters(lat, lng) {
  const x = lng * RAD * R_EARTH * COS_REF_LAT;
  const y = lat * RAD * R_EARTH;
  return [x, y];
}

/**
 * Converts local Cartesian meters [x, y] back to [lat, lng].
 */
export function toLatLng(x, y) {
  const lat = y / (RAD * R_EARTH);
  const lng = x / (RAD * R_EARTH * COS_REF_LAT);
  return [lat, lng];
}

/**
 * Calculates Euclidean distance between two (lat, lng) points in meters.
 */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const [x1, y1] = toMeters(lat1, lon1);
  const [x2, y2] = toMeters(lat2, lon2);
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Computes compass bearing from point 1 to point 2 in degrees (0 - 360).
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
  const x =
    Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) -
    Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
  const theta = Math.atan2(y, x);
  return (theta / RAD + 360) % 360;
}

/**
 * Projects point P onto line segment AB.
 * Clamps t to [0, 1] to ensure projection stays within the segment.
 */
export function projectPointToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const l2 = vx * vx + vy * vy;

  if (l2 === 0) {
    return { x: ax, y: ay, dist: Math.hypot(px - ax, py - ay), t: 0 };
  }

  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / l2));
  const qx = ax + t * vx;
  const qy = ay + t * vy;
  return {
    x: qx,
    y: qy,
    dist: Math.hypot(px - qx, py - qy),
    t,
  };
}

/**
 * Finds the nearest connected graph node that is connected to the path network (has edges).
 * Excludes isolated/disconnected nodes (like "isolated-node").
 */
export function getClosestConnectedNode(lat, lng, nodes, adjacency) {
  if (!nodes) return null;
  let bestId = null;
  let minDist = Infinity;

  Object.entries(nodes).forEach(([id, node]) => {
    // Only accept nodes that have at least one active edge in the network
    if (adjacency && (!adjacency[id] || adjacency[id].length === 0)) {
      return;
    }
    const d = distanceMeters(lat, lng, node.lat, node.lng);
    if (d < minDist) {
      minDist = d;
      bestId = id;
    }
  });

  return bestId;
}

/**
 * GPS-to-Path Matching Engine.
 * 
 * Matches raw GPS coordinates to the nearest plausible campus walking-path segment.
 * Avoids disconnected paths, filters out-of-campus coordinates, handles poor accuracy,
 * and uses temporal hysteresis to avoid jumping between distant paths during GPS jitter.
 * 
 * @param {Object} rawGps - { lat, lng, accuracy, heading, speed, timestamp }
 * @param {Object} graphData - { nodes, edges, adjacency }
 * @param {Object} options - { lastMatch, consecutiveSwitchCount }
 */
export function matchGpsToCampusPath(rawGps, graphData, options = {}) {
  const { lat, lng, accuracy = 15, heading = null, speed = null, timestamp = Date.now() } = rawGps;
  const { nodes, edges, adjacency } = graphData;
  const { lastMatch = null, consecutiveSwitchCount = 0 } = options;

  if (lat == null || lng == null || !nodes || !edges || edges.length === 0) {
    return {
      status: 'unavailable',
      isSnapped: false,
      estimatedLat: lat,
      estimatedLng: lng,
      accuracy,
      warning: 'Campus walking path graph unavailable',
    };
  }

  // 1. Campus Bounds Check
  const inCampus = isWithinCampusBounds(lat, lng, 120);
  if (!inCampus) {
    return {
      status: 'out_of_campus',
      isSnapped: false,
      estimatedLat: lat,
      estimatedLng: lng,
      accuracy,
      warning: 'Your location is outside ASIET campus. Select your starting landmark manually.',
    };
  }

  // 2. Project GPS coordinates to all valid connected edge segments
  const [px, py] = toMeters(lat, lng);
  let bestCandidate = null;
  let minDistance = Infinity;

  for (const edge of edges) {
    const fromId = edge.fromNode || edge.from;
    const toId = edge.toNode || edge.to;
    const u = nodes[fromId];
    const v = nodes[toId];

    if (!u || !v) continue;

    // Must be connected to the campus network
    if (adjacency && (!adjacency[fromId]?.length || !adjacency[toId]?.length)) {
      continue;
    }

    const [ax, ay] = toMeters(u.lat, u.lng);
    const [bx, by] = toMeters(v.lat, v.lng);
    const proj = projectPointToSegment(px, py, ax, ay, bx, by);

    if (proj.dist < minDistance) {
      minDistance = proj.dist;
      const [qLat, qLng] = toLatLng(proj.x, proj.y);
      bestCandidate = {
        edgeId: edge.edgeId || `${fromId}-${toId}`,
        fromNode: fromId,
        toNode: toId,
        distanceToPath: Math.round(proj.dist * 10) / 10,
        snappedLat: qLat,
        snappedLng: qLng,
        t: proj.t,
      };
    }
  }

  if (!bestCandidate) {
    return {
      status: 'no_path',
      isSnapped: false,
      estimatedLat: lat,
      estimatedLng: lng,
      accuracy,
      warning: 'No walkable campus path found nearby.',
    };
  }

  // 3. Plausibility Check based on distance and GPS accuracy
  // Allow snapping within max(30m, 1.5 * accuracy), capped at 55m
  const plausibleThreshold = Math.min(55, Math.max(30, accuracy ? accuracy * 1.5 : 35));

  if (bestCandidate.distanceToPath > plausibleThreshold) {
    return {
      status: 'off_path',
      isSnapped: false,
      estimatedLat: lat,
      estimatedLng: lng,
      accuracy,
      distanceToPath: bestCandidate.distanceToPath,
      warning: `Location is ${Math.round(bestCandidate.distanceToPath)}m from the nearest campus path. Showing raw location.`,
    };
  }

  // 4. Anti-Jumping / Temporal Hysteresis:
  // If we had a previous reliable match on a different edge far away, check if the jump is physically realistic.
  let finalMatch = bestCandidate;
  let newSwitchCount = 0;

  if (lastMatch && lastMatch.isSnapped && lastMatch.edgeId && lastMatch.edgeId !== bestCandidate.edgeId) {
    const distFromLastSnapped = distanceMeters(
      lastMatch.estimatedLat,
      lastMatch.estimatedLng,
      bestCandidate.snappedLat,
      bestCandidate.snappedLng
    );

    const timeDiffSeconds = Math.max(0.5, (timestamp - (lastMatch.timestamp || timestamp)) / 1000);
    const impliedSpeed = distFromLastSnapped / timeDiffSeconds; // m/s

    // Walking speed > 4.5 m/s (~16 km/h) over a significant jump (> 25m) indicates GPS multipath bounce/noise
    if (distFromLastSnapped > 25 && impliedSpeed > 4.5 && accuracy > 18) {
      if (consecutiveSwitchCount < 2) {
        // Suppress sudden jump: retain previous path position
        newSwitchCount = consecutiveSwitchCount + 1;
        return {
          ...lastMatch,
          status: 'smoothing',
          warning: 'GPS signal fluctuating near buildings; stabilizing position on path.',
          timestamp,
          consecutiveSwitchCount: newSwitchCount,
        };
      }
    }
  }

  return {
    status: 'matched',
    isSnapped: true,
    estimatedLat: finalMatch.snappedLat,
    estimatedLng: finalMatch.snappedLng,
    rawLat: lat,
    rawLng: lng,
    accuracy,
    heading,
    speed,
    edgeId: finalMatch.edgeId,
    fromNode: finalMatch.fromNode,
    toNode: finalMatch.toNode,
    distanceToPath: finalMatch.distanceToPath,
    timestamp,
    consecutiveSwitchCount: newSwitchCount,
  };
}

/**
 * Checks whether student has meaningfully deviated from the active route line.
 * @param {Object} currentPos - { lat, lng }
 * @param {Array} routeCoordinates - Array of [lng, lat]
 * @param {number} thresholdMeters - Deviation threshold (default 20m)
 */
export function detectRouteDeviation(currentPos, routeCoordinates, thresholdMeters = 20) {
  if (!currentPos || !routeCoordinates || routeCoordinates.length < 2) {
    return { deviated: false, distanceToRoute: 0 };
  }

  const [px, py] = toMeters(currentPos.lat, currentPos.lng);
  let minDistance = Infinity;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const [lngA, latA] = routeCoordinates[i];
    const [lngB, latB] = routeCoordinates[i + 1];
    const [ax, ay] = toMeters(latA, lngA);
    const [bx, by] = toMeters(latB, lngB);

    const proj = projectPointToSegment(px, py, ax, ay, bx, by);
    if (proj.dist < minDistance) {
      minDistance = proj.dist;
    }
  }

  return {
    deviated: minDistance > thresholdMeters,
    distanceToRoute: Math.round(minDistance),
  };
}

/**
 * Robust arrival detection accounting for destination radius, GPS accuracy, and repeated readings.
 * Prevents false triggers from single inaccurate readings or premature indoor claims.
 * 
 * @param {Object} currentPos - { lat, lng, accuracy }
 * @param {Object} destCoords - { lat, lng }
 * @param {Object} options - { radius: 20, maxAccuracy: 35, consecutiveRequired: 2, currentCount: 0 }
 */
export function checkArrivalDetection(currentPos, destCoords, options = {}) {
  const {
    radius = 20,
    maxAccuracy = 35,
    consecutiveRequired = 2,
    currentCount = 0,
  } = options;

  if (!currentPos || !destCoords) {
    return { isArrived: false, count: 0, distance: Infinity };
  }

  const dist = distanceMeters(currentPos.lat, currentPos.lng, destCoords.lat, destCoords.lng);
  const acc = currentPos.accuracy || 15;

  // Reliable reading requires within radius and accuracy is not completely blown out
  const isWithinRadius = dist <= radius;
  const isAccuracyAcceptable = acc <= maxAccuracy;

  if (isWithinRadius && isAccuracyAcceptable) {
    const newCount = currentCount + 1;
    return {
      isArrived: newCount >= consecutiveRequired,
      count: newCount,
      distance: Math.round(dist),
      accuracy: acc,
      message: newCount >= consecutiveRequired
        ? 'Arrived at destination building entrance area.'
        : `Approaching destination (${Math.round(dist)}m remaining)...`,
    };
  }

  return {
    isArrived: false,
    count: 0,
    distance: Math.round(dist),
    accuracy: acc,
  };
}

/**
 * Resolves destination coordinates from event and venue data without using hardcoded defaults.
 * Returns { lat, lng, nodeId, name, source } or null if no valid campus location exists.
 */
export function resolveDestination(event, venue, destParam, nodes) {
  if (!event && !venue && !destParam) return null;

  // 1. Explicit event entrance coordinates
  if (event?.locationDetails?.entranceLat != null && event?.locationDetails?.entranceLng != null) {
    const lat = Number(event.locationDetails.entranceLat);
    const lng = Number(event.locationDetails.entranceLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        nodeId: event.locationDetails.nodeId || null,
        name: event.title || event.location || 'Event Location',
        source: 'event.locationDetails.entrance'
      };
    }
  }

  // 2. Generic event lat/lng
  if (event?.locationDetails?.lat != null && event?.locationDetails?.lng != null) {
    const lat = Number(event.locationDetails.lat);
    const lng = Number(event.locationDetails.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        nodeId: event.locationDetails.nodeId || null,
        name: event.title || event.location || 'Event Location',
        source: 'event.locationDetails.latLng'
      };
    }
  }

  // 3. Event locationDetails.nodeId in campus graph
  if (event?.locationDetails?.nodeId && nodes && nodes[event.locationDetails.nodeId]) {
    const n = nodes[event.locationDetails.nodeId];
    return {
      lat: n.lat,
      lng: n.lng,
      nodeId: event.locationDetails.nodeId,
      name: event.title || n.label || 'Event Location',
      source: 'event.locationDetails.nodeId'
    };
  }

  // 4. Venue lat/lng
  if (venue?.lat != null && venue?.lng != null) {
    const lat = Number(venue.lat);
    const lng = Number(venue.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        nodeId: venue.nodeId || null,
        name: event?.title || venue.name || 'Venue Location',
        source: 'venue.latLng'
      };
    }
  }

  // 5. Venue outdoorCoordinates [lat, lng]
  if (Array.isArray(venue?.outdoorCoordinates) && venue.outdoorCoordinates.length === 2) {
    const lat = Number(venue.outdoorCoordinates[0]);
    const lng = Number(venue.outdoorCoordinates[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        lat,
        lng,
        nodeId: venue.nodeId || null,
        name: event?.title || venue.name || 'Venue Location',
        source: 'venue.outdoorCoordinates'
      };
    }
  }

  // 6. Venue nodeId in campus graph
  if (venue?.nodeId && nodes && nodes[venue.nodeId]) {
    const n = nodes[venue.nodeId];
    return {
      lat: n.lat,
      lng: n.lng,
      nodeId: venue.nodeId,
      name: event?.title || venue.name || 'Venue Location',
      source: 'venue.nodeId'
    };
  }

  // 7. VENUE_TO_NODE lookup from venue ID
  const mappedNodeId = VENUE_TO_NODE[event?.venueId || venue?.id];
  if (mappedNodeId && nodes && nodes[mappedNodeId]) {
    const n = nodes[mappedNodeId];
    return {
      lat: n.lat,
      lng: n.lng,
      nodeId: mappedNodeId,
      name: event?.title || venue?.name || n.label || 'Campus Venue',
      source: 'VENUE_TO_NODE'
    };
  }

  // 8. Explicit destParam as nodeId in campus graph
  if (destParam && nodes && nodes[destParam]) {
    const n = nodes[destParam];
    return {
      lat: n.lat,
      lng: n.lng,
      nodeId: destParam,
      name: n.label || 'Selected Landmark',
      source: 'destParam'
    };
  }

  return null;
}

