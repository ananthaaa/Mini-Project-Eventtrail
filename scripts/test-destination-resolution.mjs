import assert from 'node:assert/strict';
import fs from 'node:fs';
import { VENUE_TO_NODE } from '../src/data/buildings.js';

const graph = JSON.parse(fs.readFileSync('./src/data/graph.json', 'utf8'));

export function resolveDestination(event, venue, destParam, nodes) {
  if (!nodes) return null;

  // 1. Explicit event entrance coordinates
  if (event?.locationDetails?.entranceLat != null && event?.locationDetails?.entranceLng != null) {
    const lat = Number(event.locationDetails.entranceLat);
    const lng = Number(event.locationDetails.entranceLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, source: 'event.locationDetails.entrance', nodeId: event.locationDetails.nodeId || null };
    }
  }

  // 2. Generic event lat/lng
  if (event?.locationDetails?.lat != null && event?.locationDetails?.lng != null) {
    const lat = Number(event.locationDetails.lat);
    const lng = Number(event.locationDetails.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, source: 'event.locationDetails.latLng', nodeId: event.locationDetails.nodeId || null };
    }
  }

  // 3. Event locationDetails.nodeId
  if (event?.locationDetails?.nodeId && nodes[event.locationDetails.nodeId]) {
    const n = nodes[event.locationDetails.nodeId];
    return { lat: n.lat, lng: n.lng, source: 'event.locationDetails.nodeId', nodeId: event.locationDetails.nodeId };
  }

  // 4. Venue coordinates
  if (venue?.lat != null && venue?.lng != null) {
    const lat = Number(venue.lat);
    const lng = Number(venue.lng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, source: 'venue.latLng', nodeId: venue.nodeId || null };
    }
  }

  // 5. Venue outdoorCoordinates [lat, lng]
  if (Array.isArray(venue?.outdoorCoordinates) && venue.outdoorCoordinates.length === 2) {
    const lat = Number(venue.outdoorCoordinates[0]);
    const lng = Number(venue.outdoorCoordinates[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng, source: 'venue.outdoorCoordinates', nodeId: venue.nodeId || null };
    }
  }

  // 6. Venue nodeId
  if (venue?.nodeId && nodes[venue.nodeId]) {
    const n = nodes[venue.nodeId];
    return { lat: n.lat, lng: n.lng, source: 'venue.nodeId', nodeId: venue.nodeId };
  }

  // 7. VENUE_TO_NODE lookup
  const mappedNodeId = VENUE_TO_NODE[event?.venueId || venue?.id];
  if (mappedNodeId && nodes[mappedNodeId]) {
    const n = nodes[mappedNodeId];
    return { lat: n.lat, lng: n.lng, source: 'VENUE_TO_NODE', nodeId: mappedNodeId };
  }

  // 8. Explicit destParam as nodeId in nodes
  if (destParam && nodes[destParam]) {
    const n = nodes[destParam];
    return { lat: n.lat, lng: n.lng, source: 'destParam', nodeId: destParam };
  }

  return null;
}

// Test Event A (Futsal at Stadium)
const eventA = {
  id: 'evt-a',
  title: 'Futsal Championship',
  venueId: 'stadium-field-1',
  locationDetails: { entranceLat: 10.1777, entranceLng: 76.4305 }
};
const resA = resolveDestination(eventA, null, null, graph.nodes);
assert.equal(resA.lat, 10.1777);
assert.equal(resA.lng, 76.4305);

// Test Event B (Hackathon at Science Hall A)
const eventB = {
  id: 'evt-b',
  title: 'AI Hackathon',
  venueId: 'science-hall-a'
};
const resB = resolveDestination(eventB, { id: 'science-hall-a' }, null, graph.nodes);
assert.ok(resB.lat > 10.17);
assert.equal(resB.nodeId, 'entrance-science');

// Test Event C (Design Workshop at Hub Room 202)
const eventC = {
  id: 'evt-c',
  title: 'Design Workshop',
  venueId: 'hub-room-202'
};
const resC = resolveDestination(eventC, { id: 'hub-room-202' }, null, graph.nodes);
assert.ok(resC.lat > 10.17);
assert.equal(resC.nodeId, 'entrance-hub');

// Test Event D with no location
const eventD = {
  id: 'evt-d',
  title: 'Online Webinar'
};
const resD = resolveDestination(eventD, null, null, graph.nodes);
assert.equal(resD, null);

console.log('✓ All destination resolution tests passed successfully!');
