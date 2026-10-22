import React, { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import { NavModeContext } from '../context/NavModeContext';
import { RsvpContext } from '../context/RsvpContext';
import { NotificationContext } from '../context/NotificationContext';
import StepTracker from '../components/ui/StepTracker';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Info,
  Compass,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Crosshair,
  Check,
  Square,
  Radio,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  LocateFixed,
} from 'lucide-react';
import CampusMap, { Marker, useMap } from '../components/ui/CampusMap';
import RouteLayer from '../components/ui/RouteLayer';
import CampusBuildingMarkers from '../components/ui/CampusBuildingMarkers';
import { fetchPathNodes, fetchPathEdges } from '../services/mapService';
import { buildAdjacencyList, findPathAStar } from '../utils/pathfinding';
import {
  getClosestConnectedNode,
  distanceMeters,
  calculateBearing,
  isWithinCampusBounds,
  resolveDestination,
} from '../utils/gpsPathMatcher';
import { useLiveCampusNavigation } from '../hooks/useLiveCampusNavigation';
import Badge from '../components/ui/Badge';

// Canonical ASIET campus landmarks with verified road coordinates
export const CAMPUS_STARTING_POINTS = [
  { id: 'main-gate', name: 'Campus Main Gate (South Entrance)', lat: 10.177813, lng: 76.4291012 },
  { id: 'library', name: 'Central Library Entrance', lat: 10.1778451, lng: 76.4299169 },
  { id: 'canteen', name: 'Student Canteen & Plaza', lat: 10.1774514, lng: 76.4298325 },
  { id: 'sports-field', name: 'Athletics Ground Pavillion', lat: 10.1777, lng: 76.4305 },
  { id: 'cs-block', name: 'Computer Science Block Lobby', lat: 10.178252, lng: 76.430532 },
];

/**
 * Floating Recenter Button embedded inside CampusMap context
 */
function MapRecenterControl({ targetLng, targetLat, active }) {
  const { map } = useMap();

  const handleRecenter = () => {
    if (!map || targetLng == null || targetLat == null) return;
    map.flyTo({
      center: [targetLng, targetLat],
      zoom: 18.2,
      duration: 800,
    });
  };

  return (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
      <button
        type="button"
        onClick={handleRecenter}
        disabled={!active || targetLng == null || targetLat == null}
        className="bg-white border-2 border-black px-2.5 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-mint disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
        title="Recenter camera on your location"
      >
        <Crosshair size={13} strokeWidth={2.5} className={active ? 'text-green-600' : 'text-black'} />
        <span>Recenter</span>
      </button>
    </div>
  );
}

const Navigate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId') || searchParams.get('id');
  const destParam = searchParams.get('dest');
  const venueIdParam = searchParams.get('venueId');

  const {
    activeEventId,
    startNavigation,
    currentPhase,
    activeIndoorStep,
    setIndoorStep,
    markIndoorStepCompleted,
    finishNavigation,
    resetNavigation,
  } = useContext(NavModeContext);

  const { events, venues } = useContext(RsvpContext);
  const { addNotification } = useContext(NotificationContext);

  // Determine active event: URL parameters take absolute priority over stale session state!
  const activeEvent = useMemo(() => {
    if (eventIdParam) {
      const found = events.find(e => String(e.id) === String(eventIdParam));
      if (found) return found;
    }
    if (destParam) {
      const byId = events.find(e => String(e.id) === String(destParam));
      if (byId) return byId;
      const byVenue = events.find(e => e.venueId === destParam);
      if (byVenue) return byVenue;
    }
    if (venueIdParam) {
      const found = events.find(e => e.venueId === venueIdParam || String(e.id) === String(venueIdParam));
      if (found) return found;
    }
    if (activeEventId) {
      const found = events.find(e => String(e.id) === String(activeEventId));
      if (found) return found;
    }
    return events[0] || null;
  }, [events, eventIdParam, destParam, venueIdParam, activeEventId]);

  const venue = useMemo(() => {
    if (!activeEvent) return venues[0] || null;
    return venues.find((v) => v.id === activeEvent.venueId) || venues[0] || null;
  }, [activeEvent, venues]);

  // Graph state for campus path network
  const [nodes, setNodes] = useState(null);
  const [edges, setEdges] = useState(null);
  const [adjacency, setAdjacency] = useState(null);

  // Resolve accurate event destination from saved event coordinates & venue network
  const resolvedDestination = useMemo(() => {
    return resolveDestination(activeEvent, venue, destParam, nodes);
  }, [activeEvent, venue, destParam, nodes]);

  const hasValidDestination = Boolean(
    resolvedDestination &&
    resolvedDestination.lat != null &&
    resolvedDestination.lng != null &&
    !isNaN(resolvedDestination.lat) &&
    !isNaN(resolvedDestination.lng)
  );

  // Destination coordinates
  const destLat = resolvedDestination?.lat ?? 10.1780;
  const destLng = resolvedDestination?.lng ?? 76.4302;
  const destName = activeEvent?.title || venue?.name || resolvedDestination?.name || 'Campus Destination';

  // Navigation mode: 'manual' (default route preview) | 'live_gps' | 'simulation' (dev demo)
  const [navMode, setNavMode] = useState('manual');
  const [selectedStartPoint, setSelectedStartPoint] = useState(CAMPUS_STARTING_POINTS[0].id);

  // Manual / preview path
  const [previewPath, setPreviewPath] = useState(null);
  const [previewPathError, setPreviewPathError] = useState('');

  // Simulation state (explicitly labeled demo walk)
  const [simPlaying, setSimPlaying] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simCoords, setSimCoords] = useState(null);
  const [simHeading, setSimHeading] = useState(0);

  // Sync NavModeContext and clear stale route state whenever the selected event changes
  const prevEventIdRef = useRef(activeEvent?.id);
  useEffect(() => {
    if (activeEvent?.id && prevEventIdRef.current !== activeEvent.id) {
      prevEventIdRef.current = activeEvent.id;
      if (startNavigation) {
        startNavigation(activeEvent.id);
      }
      setPreviewPath(null);
      setPreviewPathError('');
      setSimProgress(0);
      setSimPlaying(false);
      setSimCoords(null);
    }
  }, [activeEvent?.id, startNavigation]);

  // Destination coordinates object
  const destCoords = useMemo(() => ({
    lat: destLat,
    lng: destLng,
    name: destName,
  }), [destLat, destLng, destName]);

  // Load campus road graph
  useEffect(() => {
    let mounted = true;
    async function loadGraph() {
      try {
        const fetchedNodes = await fetchPathNodes();
        const fetchedEdges = await fetchPathEdges();
        if (mounted) {
          setNodes(fetchedNodes);
          setEdges(fetchedEdges);
          setAdjacency(buildAdjacencyList(fetchedEdges));
        }
      } catch (e) {
        console.warn("Could not load campus road graph:", e.message);
      }
    }
    loadGraph();
    return () => { mounted = false; };
  }, []);

  // Live GPS hook
  const {
    gpsStatus,
    rawLocation,
    snappedLocation,
    heading: liveHeading,
    accuracy: liveAccuracy,
    errorMessage: liveError,
    warningMessage: liveWarning,
    activeRoute: liveRouteNodes,
    routeCoordinates: liveRouteCoordinates,
    routeDistance: liveRouteDistance,
    estimatedMinutes: liveEstimatedMinutes,
    isArrived,
    arrivalInfo,
    recalculationNotice,
    manualRecalculate,
    resetArrival,
  } = useLiveCampusNavigation({
    active: navMode === 'live_gps',
    nodes,
    edges,
    adjacency,
    destCoords,
    arrivalRadius: 20,
    onRouteRecalculated: () => {
      addNotification("Route recalculated to match your current walking path.", "info");
    },
    onArrival: (info) => {
      addNotification(info?.message || `Arrived at ${destName} entrance area!`, "success");
    },
  });

  // Calculate Landmark Route Preview (Manual Mode)
  useEffect(() => {
    if (navMode === 'manual' && nodes && adjacency) {
      if (!hasValidDestination) {
        setPreviewPath(null);
        setPreviewPathError('No verified campus coordinates available for this event.');
        return;
      }
      const startPt = CAMPUS_STARTING_POINTS.find(p => p.id === selectedStartPoint) || CAMPUS_STARTING_POINTS[0];
      const startNodeId = getClosestConnectedNode(startPt.lat, startPt.lng, nodes, adjacency);
      const destNodeId = getClosestConnectedNode(destLat, destLng, nodes, adjacency);

      if (startNodeId && destNodeId) {
        const path = findPathAStar(startNodeId, destNodeId, adjacency, nodes);
        if (path) {
          setPreviewPath(path);
          setPreviewPathError('');
        } else {
          setPreviewPath(null);
          setPreviewPathError('No verified walking path found between chosen coordinates.');
        }
      }
    }
  }, [navMode, selectedStartPoint, nodes, adjacency, destLat, destLng, hasValidDestination]);

  // Manual start point change handler
  const handleStartPointChange = (startId) => {
    setSelectedStartPoint(startId);
    setSimProgress(0);
    setSimPlaying(false);
    setSimCoords(null);
  };

  // Convert manual preview path to coordinates array
  const previewCoordinates = useMemo(() => {
    if (!previewPath || !nodes) return [];
    const startPt = CAMPUS_STARTING_POINTS.find(p => p.id === selectedStartPoint) || CAMPUS_STARTING_POINTS[0];
    const coords = [[startPt.lng, startPt.lat]];
    previewPath.forEach(id => {
      const n = nodes[id];
      if (n) coords.push([n.lng, n.lat]);
    });
    coords.push([destLng, destLat]);
    return coords;
  }, [previewPath, nodes, selectedStartPoint, destLng, destLat]);

  // Manual preview route distance & estimated walking time
  const previewDistance = useMemo(() => {
    if (!previewCoordinates || previewCoordinates.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < previewCoordinates.length - 1; i++) {
      dist += distanceMeters(
        previewCoordinates[i][1], previewCoordinates[i][0],
        previewCoordinates[i + 1][1], previewCoordinates[i + 1][0]
      );
    }
    return Math.round(dist);
  }, [previewCoordinates]);

  const previewMinutes = useMemo(() => {
    return Math.max(1, Math.round(previewDistance / 75));
  }, [previewDistance]);

  // Explicit Demo Simulation (Walks along verified path nodes)
  useEffect(() => {
    let timer;
    if (navMode === 'simulation' && simPlaying && previewCoordinates.length >= 2) {
      timer = setInterval(() => {
        setSimProgress(prev => {
          const next = Math.min(prev + 2, 100);
          const totalPoints = previewCoordinates.length;
          const indexFloat = (next / 100) * (totalPoints - 1);
          const idx = Math.floor(indexFloat);
          const remainder = indexFloat - idx;

          const p1 = previewCoordinates[idx];
          const p2 = previewCoordinates[Math.min(idx + 1, totalPoints - 1)];

          const curLng = p1[0] + (p2[0] - p1[0]) * remainder;
          const curLat = p1[1] + (p2[1] - p1[1]) * remainder;

          const b = calculateBearing(p1[1], p1[0], p2[1], p2[0]);
          if (!isNaN(b)) setSimHeading(Math.round(b));

          setSimCoords({ lat: curLat, lng: curLng });

          if (next >= 100) {
            setSimPlaying(false);
            addNotification("Simulation complete: Reached destination entrance area.", "success");
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [navMode, simPlaying, previewCoordinates, addNotification]);

  // Active coordinates for the map
  const activeUserLat = useMemo(() => {
    if (navMode === 'live_gps') {
      return snappedLocation?.lat || rawLocation?.lat || CAMPUS_STARTING_POINTS[0].lat;
    }
    if (navMode === 'simulation' && simCoords) {
      return simCoords.lat;
    }
    const pt = CAMPUS_STARTING_POINTS.find(p => p.id === selectedStartPoint) || CAMPUS_STARTING_POINTS[0];
    return pt.lat;
  }, [navMode, snappedLocation, rawLocation, simCoords, selectedStartPoint]);

  const activeUserLng = useMemo(() => {
    if (navMode === 'live_gps') {
      return snappedLocation?.lng || rawLocation?.lng || CAMPUS_STARTING_POINTS[0].lng;
    }
    if (navMode === 'simulation' && simCoords) {
      return simCoords.lng;
    }
    const pt = CAMPUS_STARTING_POINTS.find(p => p.id === selectedStartPoint) || CAMPUS_STARTING_POINTS[0];
    return pt.lng;
  }, [navMode, snappedLocation, rawLocation, simCoords, selectedStartPoint]);

  // Display distance and time
  const displayDistance = navMode === 'live_gps' ? liveRouteDistance : previewDistance;
  const displayMinutes = navMode === 'live_gps' ? liveEstimatedMinutes : previewMinutes;

  // Active route coordinates for RouteLayer
  const activeRouteCoords = useMemo(() => {
    if (navMode === 'live_gps') {
      return liveRouteCoordinates;
    }
    return previewCoordinates;
  }, [navMode, liveRouteCoordinates, previewCoordinates]);

  // Indoor Turn-by-Turn Steps
  const indoorStepsArray = useMemo(() => {
    if (activeEvent?.locationDetails?.indoorSteps && activeEvent.locationDetails.indoorSteps.length > 0) {
      return activeEvent.locationDetails.indoorSteps;
    }
    if (venue?.indoorSteps && venue.indoorSteps.length > 0) {
      return venue.indoorSteps;
    }
    return [
      'Enter the building through the designated campus entrance',
      'Check the floor directory sign in the main lobby',
      'Proceed to the event hall/room listed on your admission pass'
    ];
  }, [activeEvent, venue]);

  if (!activeEvent && events.length === 0) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <Navigation className="w-12 h-12 text-black/40 mx-auto mb-4" />
          <h2 className="font-display font-black text-2xl uppercase mb-2">No Active Navigation</h2>
          <p className="font-bold text-sm text-black/70 mb-6">
            Explore live campus events and launch walking directions from any event details page.
          </p>
          <Link
            to="/student/events"
            className="inline-block py-3 px-6 bg-pastel-yellow border-3 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_#000]"
          >
            Browse Campus Events
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-6 text-left border-b-3 border-black pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link
            to={`/student/events/${activeEvent?.id || ''}`}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black mb-2 hover:underline"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Back to Event Details
          </Link>
          <h1 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-black flex items-center gap-3">
            <span>Campus Navigation</span>
            {navMode === 'live_gps' && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
              </span>
            )}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={hasValidDestination ? "mint" : "pink"}
            className="border-2 border-black shadow-[1px_1px_0px_0px_#000]"
          >
            Destination: {hasValidDestination ? (activeEvent?.location || venue?.name || 'Campus Venue') : 'No Campus Location'}
          </Badge>
          {navMode === 'live_gps' && (
            <Badge variant="yellow" className="border-2 border-black shadow-[1px_1px_0px_0px_#000] flex items-center gap-1">
              <Radio size={12} className="animate-pulse text-red-600" />
              <span>LIVE GPS</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Missing or Invalid Campus Location Warning */}
      {!hasValidDestination && (
        <div className="mb-6 p-4 bg-amber-100 border-3 border-black neo-shadow flex items-start gap-3 text-left">
          <AlertTriangle size={24} className="text-amber-800 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-black text-sm uppercase tracking-wide text-black">
              No Campus Location Available
            </h3>
            <p className="text-xs font-bold text-black/80 mt-1">
              {activeEvent?.title
                ? `The event "${activeEvent.title}" does not have valid campus map coordinates or venue assigned yet.`
                : 'No destination or campus event selected. Please select an event from the Events directory to view its route.'}
            </p>
          </div>
        </div>
      )}

      {/* Recalculation Notification Banner */}
      <AnimatePresence>
        {recalculationNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-3 bg-pastel-yellow border-3 border-black neo-shadow flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black">
              <RefreshCw size={14} className="animate-spin text-black" />
              <span>{recalculationNotice}</span>
            </div>
            <button
              onClick={() => {}}
              className="text-xs font-bold underline hover:opacity-75"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destination Arrival Notification */}
      <AnimatePresence>
        {isArrived && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-pastel-mint border-3 border-black neo-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-black text-white flex items-center justify-center shrink-0 border-2 border-black">
                <CheckCircle2 size={24} className="text-pastel-mint" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm uppercase tracking-wide text-black">
                  Destination Reached
                </h3>
                <p className="text-xs font-bold text-black/80">
                  {arrivalInfo?.message || `You are within the entrance area of ${destName}. Proceed inside for event check-in!`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIndoorStep(0)}
                className="px-3 py-1.5 bg-black text-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-800"
              >
                View Indoor Steps →
              </button>
              <button
                type="button"
                onClick={resetArrival}
                className="p-1.5 bg-white border-2 border-black text-xs font-black uppercase shadow-[1px_1px_0px_0px_#000]"
                title="Dismiss arrival notification"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Control Center */}
      <div className="bg-white border-3 border-black p-4 neo-shadow mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-black block mb-1">
              Campus Navigation Controls
            </span>
            <p className="text-xs font-medium text-black/70">
              Switch between Live GPS walking navigation, landmark route preview, or demo simulation.
            </p>
          </div>

          {/* Primary Navigation Mode Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live GPS Button (Clear & Prominent) */}
            <button
              id="live-gps-toggle-btn"
              type="button"
              onClick={() => {
                if (navMode === 'live_gps') {
                  setNavMode('manual');
                } else {
                  setNavMode('live_gps');
                  setSimPlaying(false);
                }
              }}
              className={`px-3.5 py-2 text-xs font-display font-black uppercase tracking-wider border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer ${
                navMode === 'live_gps'
                  ? 'bg-pastel-mint text-black shadow-[3px_3px_0px_0px_#000] scale-[1.02]'
                  : 'bg-pastel-yellow hover:bg-pastel-mint/60 text-black shadow-[2px_2px_0px_0px_#000]'
              }`}
            >
              {navMode === 'live_gps' ? (
                <>
                  <Square size={13} strokeWidth={3} className="text-red-600 fill-red-600" />
                  <span>Stop Live GPS</span>
                </>
              ) : (
                <>
                  <Radio size={14} className="animate-pulse text-green-700" />
                  <span>Start Live GPS</span>
                </>
              )}
            </button>

            {/* Mode selection tabs */}
            <div className="flex border-2 border-black bg-gray-100 p-1 shadow-[2px_2px_0px_0px_#000]">
              <button
                type="button"
                onClick={() => {
                  setNavMode('manual');
                  setSimPlaying(false);
                }}
                className={`px-3 py-1 text-xs font-display font-black uppercase tracking-wider transition-all ${
                  navMode === 'manual'
                    ? 'bg-white border border-black shadow-[1px_1px_0px_0px_#000]'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                Landmark Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setNavMode('simulation');
                }}
                className={`px-3 py-1 text-xs font-display font-black uppercase tracking-wider transition-all ${
                  navMode === 'simulation'
                    ? 'bg-pastel-yellow border border-black shadow-[1px_1px_0px_0px_#000]'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                Demo Simulation
              </button>
            </div>
          </div>
        </div>

        {/* Live GPS Status & Diagnostics */}
        {navMode === 'live_gps' && (
          <div className="mt-4 pt-3 border-t-2 border-black/10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* GPS Status Indicator */}
              <div className="flex items-center gap-2 p-2 border-2 border-black bg-gray-50 shadow-[1px_1px_0px_0px_#000]">
                {gpsStatus === 'active' && (
                  <>
                    <Crosshair size={14} className="text-green-600 animate-spin-slow shrink-0" />
                    <span className="text-xs font-black uppercase text-green-800">
                      GPS Tracking Active
                    </span>
                  </>
                )}
                {gpsStatus === 'acquiring' && (
                  <>
                    <Compass size={14} className="text-amber-600 animate-spin shrink-0" />
                    <span className="text-xs font-black uppercase text-amber-800">
                      Acquiring Location...
                    </span>
                  </>
                )}
                {gpsStatus === 'weak_signal' && (
                  <>
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <span className="text-xs font-black uppercase text-amber-800">
                      Weak Signal (Retaining Path)
                    </span>
                  </>
                )}
                {gpsStatus === 'permission_denied' && (
                  <>
                    <ShieldAlert size={14} className="text-red-600 shrink-0" />
                    <span className="text-xs font-black uppercase text-red-800">
                      Permission Denied
                    </span>
                  </>
                )}
                {gpsStatus === 'out_of_campus' && (
                  <>
                    <MapPin size={14} className="text-purple-600 shrink-0" />
                    <span className="text-xs font-black uppercase text-purple-800">
                      Outside ASIET Campus
                    </span>
                  </>
                )}
                {gpsStatus === 'off_path' && (
                  <>
                    <Info size={14} className="text-blue-600 shrink-0" />
                    <span className="text-xs font-black uppercase text-blue-800">
                      Off Mapped Path
                    </span>
                  </>
                )}
              </div>

              {/* Path Matching State */}
              <div className="flex items-center justify-between p-2 border-2 border-black bg-gray-50 shadow-[1px_1px_0px_0px_#000]">
                <span className="text-[10px] font-black uppercase tracking-wider text-black/60">
                  Path Matching
                </span>
                <span className="text-xs font-black uppercase text-black">
                  {snappedLocation?.isSnapped ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <Check size={12} strokeWidth={3} />
                      Snapped to Walkway
                    </span>
                  ) : (
                    <span className="text-amber-700">Raw Coordinate</span>
                  )}
                </span>
              </div>

              {/* Accuracy & Heading */}
              <div className="flex items-center justify-between p-2 border-2 border-black bg-gray-50 shadow-[1px_1px_0px_0px_#000]">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black/60">
                    GPS Accuracy
                  </span>
                  <span className="text-xs font-mono font-black text-black">
                    {liveAccuracy != null ? `±${liveAccuracy}m` : 'Measuring...'}
                    {liveHeading != null && !isNaN(liveHeading) ? ` • ${liveHeading}°` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={manualRecalculate}
                  className="px-1.5 py-1 bg-white border border-black hover:bg-pastel-yellow text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                  title="Recalculate path to destination"
                >
                  <RefreshCw size={10} />
                  <span>Reroute</span>
                </button>
              </div>
            </div>

            {/* Error or Warning Message */}
            {liveError && (
              <div className="mt-3 p-2.5 bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-red-600" />
                  <span>{liveError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNavMode('manual')}
                  className="px-2 py-1 bg-white border border-black font-black uppercase text-[10px] hover:bg-gray-100 shrink-0"
                >
                  Use Landmark Route
                </button>
              </div>
            )}

            {liveWarning && !liveError && (
              <div className="mt-3 p-2 bg-amber-50 border-2 border-amber-400 text-amber-900 text-xs font-bold flex items-center gap-2">
                <Info size={14} className="shrink-0 text-amber-700" />
                <span>{liveWarning}</span>
              </div>
            )}
          </div>
        )}

        {/* Manual Landmark Selector (Preview Mode) */}
        {navMode === 'manual' && (
          <div className="mt-4 pt-3 border-t border-black/10 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <label htmlFor="nav-startpoint" className="text-xs font-black uppercase tracking-wider shrink-0">
                  Starting Landmark:
                </label>
                <select
                  id="nav-startpoint"
                  value={selectedStartPoint}
                  onChange={(e) => handleStartPointChange(e.target.value)}
                  className="border-2 border-black p-2 font-bold text-xs bg-white uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] w-full sm:w-auto cursor-pointer"
                >
                  {CAMPUS_STARTING_POINTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-bold text-black/60">
                Select any campus landmark to preview the verified walking path.
              </div>
            </div>

            {previewPathError && (
              <div className="p-2 bg-amber-50 border-2 border-amber-400 text-amber-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{previewPathError}</span>
              </div>
            )}
          </div>
        )}

        {/* Explicit Demo Simulation Controls */}
        {navMode === 'simulation' && (
          <div className="mt-4 pt-3 border-t border-black/10 bg-amber-50/80 p-3 border-2 border-dashed border-amber-600 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="yellow" className="border border-black font-black">
                  DEMO SIMULATION (Dev Testing Only)
                </Badge>
                <span className="text-xs font-bold text-black/80">
                  Simulating walking path from {CAMPUS_STARTING_POINTS.find(p => p.id === selectedStartPoint)?.name.split('(')[0]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimPlaying(!simPlaying)}
                  className="px-3 py-1.5 bg-pastel-mint border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer"
                >
                  {simPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{simPlaying ? 'Pause Walk' : 'Play Walk'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimProgress(0);
                    setSimPlaying(false);
                    setSimCoords(null);
                  }}
                  className="p-1.5 bg-white border-2 border-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  title="Reset Demo Walk"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Simulation Progress Track */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-black shrink-0">
                {simProgress}%
              </span>
              <div className="flex-1 bg-gray-200 border-2 border-black h-3 relative">
                <div
                  className="bg-pastel-yellow h-full transition-all duration-200 border-r-2 border-black"
                  style={{ width: `${simProgress}%` }}
                />
              </div>
              <span className="text-xs font-bold text-black/60 shrink-0">
                {simProgress >= 100 ? 'Arrived at building' : 'Walking route...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Interactive Campus Map & Turn-by-Turn Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Campus Vector Map */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border-3 border-black neo-shadow overflow-hidden flex flex-col h-[480px] md:h-[540px]">
            {/* Map Top Bar */}
            <div className="p-3 border-b-2 border-black bg-pastel-yellow flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                <MapPin size={14} />
                ASIET Campus Map {navMode === 'live_gps' ? '• Live View' : '• Route Preview'}
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span>Distance: ~{displayDistance}m</span>
                <span>Est: ~{displayMinutes} min walk</span>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 w-full relative min-h-[440px]">
              <CampusMap
                center={[destLng, destLat]}
                zoom={17.8}
                initialPitch={55}
                initialBearing={-25}
              >
                {/* Floating Recenter Control */}
                <MapRecenterControl
                  targetLng={activeUserLng}
                  targetLat={activeUserLat}
                  active={navMode === 'live_gps' || navMode === 'simulation'}
                />

                {/* Highlighted Walking Route Layer */}
                {hasValidDestination && activeRouteCoords && activeRouteCoords.length > 1 && (
                  <RouteLayer
                    coordinates={activeRouteCoords}
                    nodes={nodes}
                    autoFitBounds={false}
                  />
                )}

                {/* Canonical Campus Building Name Markers */}
                <CampusBuildingMarkers nodes={nodes} />

                {/* Destination Venue Pin */}
                {hasValidDestination && (
                  <Marker longitude={destLng} latitude={destLat} anchor="bottom">
                    <div className="flex flex-col items-center cursor-pointer group">
                      <div className="bg-[#FF5A1F] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                        DEST: {destName.slice(0, 16)}
                      </div>
                      <div className="w-5 h-5 bg-[#FF5A1F] border-3 border-black rounded-none shadow-[2px_2px_0px_0px_#000]" />
                    </div>
                  </Marker>
                )}

                {/* Student Position Marker */}
                <Marker longitude={activeUserLng} latitude={activeUserLat} anchor="center">
                  <div className="relative flex flex-col items-center">
                    {/* Accuracy Halo (in Live GPS mode) */}
                    {navMode === 'live_gps' && liveAccuracy && liveAccuracy < 50 && (
                      <div
                        className="absolute rounded-full border-2 border-dashed border-[#00B67A]/60 bg-[#00B67A]/15 pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
                        style={{
                          width: `${Math.min(80, Math.max(30, liveAccuracy * 1.8))}px`,
                          height: `${Math.min(80, Math.max(30, liveAccuracy * 1.8))}px`,
                        }}
                      />
                    )}

                    {/* Directional arrow icon rotated by heading */}
                    <div
                      className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] transition-transform duration-300 ${
                        navMode === 'live_gps'
                          ? 'bg-[#00B67A]'
                          : navMode === 'simulation'
                          ? 'bg-amber-400'
                          : 'bg-pastel-yellow'
                      }`}
                      style={{
                        transform: `rotate(${navMode === 'live_gps' ? (liveHeading || 0) : (simHeading || 0)}deg)`,
                      }}
                      title={
                        navMode === 'live_gps'
                          ? `Heading: ${liveHeading || 0}°`
                          : 'Starting point'
                      }
                    >
                      {navMode === 'live_gps' || navMode === 'simulation' ? (
                        <Navigation className="w-4 h-4 text-white fill-white" />
                      ) : (
                        <MapPin className="w-4 h-4 text-black" />
                      )}
                    </div>

                    {/* Marker Label Badge */}
                    <div className="mt-1 bg-white border border-black px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider shadow-[1px_1px_0px_0px_#000] whitespace-nowrap">
                      {navMode === 'live_gps'
                        ? snappedLocation?.isSnapped
                          ? 'YOU (PATH)'
                          : 'YOU (RAW)'
                        : navMode === 'simulation'
                        ? 'SIM WALK'
                        : 'START'}
                    </div>
                  </div>
                </Marker>
              </CampusMap>
            </div>
          </div>

          {/* Quick Details Banner */}
          <div className="bg-white border-3 border-black p-4 neo-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block">Target Hall / Event</span>
              <span className="font-display font-black text-base uppercase text-black">{activeEvent?.location || venue?.name}</span>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block">Building Complex</span>
              <span className="font-bold text-xs uppercase text-black">{venue?.building || 'Main Campus'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Turn-by-Turn Walking & Indoor Steps */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border-3 border-black p-6 neo-shadow flex flex-col h-full text-left">
            <h2 className="font-display font-black text-lg uppercase border-b-2 border-black pb-2 mb-4 flex items-center justify-between">
              <span>Indoor Directions</span>
              <span className="text-xs font-mono font-bold bg-pastel-mint px-2 py-0.5 border border-black">
                {indoorStepsArray.length} steps
              </span>
            </h2>

            <p className="text-xs font-bold text-black/70 mb-4">
              Follow these verified steps once you arrive at the building entrance:
            </p>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {indoorStepsArray.map((stepText, idx) => {
                const isCurrent = activeIndoorStep === idx;
                const isDone = idx < activeIndoorStep;

                return (
                  <div
                    key={idx}
                    onClick={() => setIndoorStep(idx)}
                    className={`p-3.5 border-2 border-black transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-pastel-yellow shadow-[3px_3px_0px_0px_#000] scale-[1.02]'
                        : isDone
                        ? 'bg-pastel-mint/30 opacity-70'
                        : 'bg-gray-50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-6 h-6 rounded-full border border-black text-xs font-black flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-pastel-mint' : isCurrent ? 'bg-black text-white' : 'bg-white'
                      }`}>
                        {isDone ? <Check size={12} strokeWidth={3} /> : idx + 1}
                      </span>
                      <p className="text-xs font-bold text-black leading-snug pt-0.5">
                        {stepText}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t-2 border-black/15 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIndoorStep(Math.max(0, activeIndoorStep - 1))}
                disabled={activeIndoorStep <= 0}
                className="px-3 py-2 border-2 border-black bg-white font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setIndoorStep(Math.min(indoorStepsArray.length - 1, activeIndoorStep + 1))}
                disabled={activeIndoorStep >= indoorStepsArray.length - 1}
                className="px-4 py-2 border-2 border-black bg-pastel-mint font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] disabled:opacity-40 cursor-pointer"
              >
                Next Step →
              </button>
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
};

export default Navigate;
