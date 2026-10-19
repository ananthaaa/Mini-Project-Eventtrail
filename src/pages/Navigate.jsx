import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import { NavModeContext } from '../context/NavModeContext';
import { RsvpContext } from '../context/RsvpContext';
import { NotificationContext } from '../context/NotificationContext';
import StepTracker from '../components/ui/StepTracker';
import { MapPin, Navigation, CheckCircle2, ChevronRight, ArrowLeft, Info, Compass, Play, Pause, RotateCcw, AlertTriangle, Crosshair, Check } from 'lucide-react';
import CampusMap, { Marker } from '../components/ui/CampusMap';
import RouteLayer from '../components/ui/RouteLayer';
import CampusBuildingMarkers from '../components/ui/CampusBuildingMarkers';
import { fetchPathNodes, fetchPathEdges } from '../services/mapService';
import { buildAdjacencyList, findPathAStar } from '../utils/pathfinding';
import Badge from '../components/ui/Badge';

const CAMPUS_STARTING_POINTS = [
  { id: 'main-gate', name: 'Campus Main Gate (South Entrance)', lat: 10.177813, lng: 76.4291012 },
  { id: 'library', name: 'Central Library Entrance', lat: 10.1778, lng: 76.4298 },
  { id: 'canteen', name: 'Student Canteen & Plaza', lat: 10.1774514, lng: 76.4298325 },
  { id: 'sports-field', name: 'Athletics Ground Pavillion', lat: 10.1777, lng: 76.4305 },
  { id: 'cs-block', name: 'Computer Science Block Lobby', lat: 10.178252, lng: 76.430532 },
];

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const Navigate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const destParam = searchParams.get('dest');
  const venueIdParam = searchParams.get('venueId');

  const {
    activeEventId,
    currentPhase,
    activeIndoorStep,
    setIndoorStep,
    markIndoorStepCompleted,
    finishNavigation,
    resetNavigation,
  } = useContext(NavModeContext);

  const { events, venues } = useContext(RsvpContext);
  const { addNotification } = useContext(NotificationContext);

  // Determine active event or fallback to first event with venue
  // Supports: ?venueId= (from Dashboard campus directions) and ?dest= (from EventDetail)
  const activeEvent = useMemo(() => {
    if (activeEventId) return events.find(e => e.id === activeEventId);
    if (venueIdParam) return events.find(e => e.venueId === venueIdParam) || events.find(e => e.id === venueIdParam) || events[0] || null;
    if (destParam) return events.find(e => e.id === destParam || e.venueId === destParam);
    return events[0] || null;
  }, [events, activeEventId, destParam, venueIdParam]);

  const venue = useMemo(() => {
    if (!activeEvent) return venues[0] || null;
    return venues.find((v) => v.id === activeEvent.venueId) || venues[0] || null;
  }, [activeEvent, venues]);

  // Destination coordinates
  const destLat = activeEvent?.locationDetails?.entranceLat || venue?.lat || 10.1780;
  const destLng = activeEvent?.locationDetails?.entranceLng || venue?.lng || 76.4302;

  // Navigation mode: 'manual' (default honest landmark walk) | 'live_gps' | 'simulation' (explicit demo)
  const [navMode, setNavMode] = useState('manual');
  const [selectedStartPoint, setSelectedStartPoint] = useState(CAMPUS_STARTING_POINTS[0].id);
  const [gpsError, setGpsError] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // Position coordinates
  const [currentLat, setCurrentLat] = useState(CAMPUS_STARTING_POINTS[0].lat);
  const [currentLng, setCurrentLng] = useState(CAMPUS_STARTING_POINTS[0].lng);

  // Simulation controls
  const [simPlaying, setSimPlaying] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  // Graph state for pathfinding
  const [nodes, setNodes] = useState(null);
  const [adjacency, setAdjacency] = useState(null);
  const [computedPath, setComputedPath] = useState(null);
  const [pathError, setPathError] = useState('');

  // Manual start point change
  const handleStartPointChange = (startId) => {
    setSelectedStartPoint(startId);
    const pt = CAMPUS_STARTING_POINTS.find(p => p.id === startId);
    if (pt) {
      setCurrentLat(pt.lat);
      setCurrentLng(pt.lng);
      setSimProgress(0);
      setSimPlaying(false);
    }
  };

  // Live GPS Tracking
  useEffect(() => {
    if (navMode !== 'live_gps') return;

    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      setNavMode('manual');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
      },
      (err) => {
        console.warn('Geolocation access denied or failed:', err.message);
        setGpsError('GPS access denied or unavailable. Switched to manual landmark selection.');
        setNavMode('manual');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [navMode]);

  // Explicit Simulation Mode
  useEffect(() => {
    let timer;
    if (navMode === 'simulation' && simPlaying && simProgress < 100) {
      timer = setInterval(() => {
        setSimProgress(prev => {
          const next = Math.min(prev + 3, 100);
          const startPt = CAMPUS_STARTING_POINTS.find(p => p.id === selectedStartPoint) || CAMPUS_STARTING_POINTS[0];
          const fraction = next / 100;
          setCurrentLat(startPt.lat + (destLat - startPt.lat) * fraction);
          setCurrentLng(startPt.lng + (destLng - startPt.lng) * fraction);

          if (next >= 100) {
            setSimPlaying(false);
            addNotification("Simulation arrival reached: At building entrance.", "info");
          }
          return next;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [navMode, simPlaying, simProgress, destLat, destLng, selectedStartPoint]);

  // Load graph for A* navigation
  useEffect(() => {
    async function loadGraph() {
      try {
        const fetchedNodes = await fetchPathNodes();
        const fetchedEdges = await fetchPathEdges();
        setNodes(fetchedNodes);
        setAdjacency(buildAdjacencyList(fetchedEdges));
      } catch (e) {
        console.warn("Could not load road graph, path preview unavailable:", e.message);
      }
    }
    loadGraph();
  }, []);

  const getClosestNode = (lat, lng, nodesObj) => {
    let closestId = null;
    let minDistance = Infinity;
    Object.entries(nodesObj).forEach(([id, node]) => {
      const dist = haversineDistance(lat, lng, node.lat, node.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestId = id;
      }
    });
    return closestId;
  };

  useEffect(() => {
    if (nodes && adjacency) {
      const startNodeId = getClosestNode(currentLat, currentLng, nodes);
      const destNodeId = getClosestNode(destLat, destLng, nodes);
      if (startNodeId && destNodeId) {
        const path = findPathAStar(startNodeId, destNodeId, adjacency, nodes);
        if (path) {
          setComputedPath(path);
          setPathError('');
        } else {
          setComputedPath(null);
          setPathError('No verified paved path found between chosen coordinates.');
        }
      }
    }
  }, [nodes, adjacency, currentLat, currentLng, destLat, destLng]);

  const distanceRemaining = Math.round(haversineDistance(currentLat, currentLng, destLat, destLng));
  const estimatedWalkingMinutes = Math.max(1, Math.round(distanceRemaining / 75)); // ~4.5 km/h walk

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
          <h1 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tight text-black">
            Campus Walking Guide
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="mint" className="border-2 border-black shadow-[1px_1px_0px_0px_#000]">
            Destination: {activeEvent?.location || venue?.name || 'Campus Venue'}
          </Badge>
        </div>
      </div>

      {/* Navigation Mode Selector */}
      <div className="bg-white border-3 border-black p-4 neo-shadow mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-black block mb-1">
              Select Navigation Mode
            </span>
            <p className="text-xs font-medium text-black/70">
              Choose live GPS, landmark walking directions, or run a demonstration simulation.
            </p>
          </div>

          <div className="flex border-2 border-black bg-gray-100 p-1 shadow-[2px_2px_0px_0px_#000]">
            {[
              { id: 'manual', label: 'Landmark Route' },
              { id: 'live_gps', label: 'Live GPS' },
              { id: 'simulation', label: 'Demo Simulation' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setNavMode(m.id);
                  if (m.id !== 'simulation') setSimPlaying(false);
                }}
                className={`px-3 py-1.5 text-xs font-display font-black uppercase tracking-wider transition-all ${
                  navMode === m.id
                    ? 'bg-pastel-yellow border border-black shadow-[1px_1px_0px_0px_#000]'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* GPS status feedback */}
        {navMode === 'live_gps' && (
          <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between text-xs font-bold text-black">
            <span className="flex items-center gap-1.5 text-green-700">
              <Crosshair size={14} className="animate-pulse" />
              Live GPS Tracking Active
            </span>
            {gpsAccuracy && (
              <span className="font-mono text-black/60">Accuracy: ±{gpsAccuracy}m</span>
            )}
          </div>
        )}

        {gpsError && (
          <div className="mt-3 p-2 bg-amber-50 border-2 border-amber-400 text-amber-800 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={14} />
            {gpsError}
          </div>
        )}

        {/* Manual Landmark Selector */}
        {navMode === 'manual' && (
          <div className="mt-3 pt-3 border-t border-black/10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label htmlFor="nav-startpoint" className="text-xs font-black uppercase tracking-wider shrink-0">
              Starting Landmark:
            </label>
            <select
              id="nav-startpoint"
              value={selectedStartPoint}
              onChange={(e) => handleStartPointChange(e.target.value)}
              className="border-2 border-black p-2 font-bold text-xs bg-white uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] w-full sm:w-auto"
            >
              {CAMPUS_STARTING_POINTS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Explicit Demo Simulation Controls */}
        {navMode === 'simulation' && (
          <div className="mt-3 pt-3 border-t border-black/10 bg-amber-50/60 p-3 border-2 border-dashed border-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="yellow" className="border border-black">DEMO SIMULATION</Badge>
              <span className="text-xs font-bold text-black/80">
                Simulated walking path demonstration ({simProgress}% complete)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimPlaying(!simPlaying)}
                className="px-3 py-1.5 bg-pastel-mint border-2 border-black font-black uppercase text-xs shadow-[1px_1px_0px_0px_#000] flex items-center gap-1"
              >
                {simPlaying ? <Pause size={12} /> : <Play size={12} />}
                {simPlaying ? 'Pause' : 'Play Walk'}
              </button>
              <button
                onClick={() => { setSimProgress(0); setSimPlaying(false); handleStartPointChange(selectedStartPoint); }}
                className="p-1.5 bg-white border-2 border-black hover:bg-gray-100 shadow-[1px_1px_0px_0px_#000]"
                title="Reset Simulation"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Interactive Campus Map & Turn-by-Turn Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Campus Vector Map */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border-3 border-black neo-shadow overflow-hidden flex flex-col h-[460px] md:h-[520px]">
            <div className="p-3 border-b-2 border-black bg-pastel-yellow flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                <MapPin size={14} />
                ASIET Campus Map Navigation
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span>Distance: ~{distanceRemaining}m</span>
                <span>Est: ~{estimatedWalkingMinutes} min walk</span>
              </div>
            </div>

            <div className="flex-1 w-full relative min-h-[480px]">
              <CampusMap center={[destLng, destLat]} zoom={17.8} initialPitch={55} initialBearing={-25}>
                {/* Road Route Path Layer */}
                {computedPath && <RouteLayer path={computedPath} nodes={nodes} autoFitBounds={false} />}

                {/* Same Canonical Campus Building Name Markers */}
                <CampusBuildingMarkers nodes={nodes} />

                {/* Destination Venue Pin matching FullCampusMap style */}
                <Marker longitude={destLng} latitude={destLat} anchor="bottom">
                  <div className="flex flex-col items-center cursor-pointer group">
                    <div className="bg-[#FF5A1F] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                      DEST
                    </div>
                    <div className="w-5 h-5 bg-[#FF5A1F] border-3 border-black rounded-none shadow-[2px_2px_0px_0px_#000]" />
                  </div>
                </Marker>

                {/* User Current / Starting Position Marker */}
                <Marker longitude={currentLng} latitude={currentLat} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#00B67A] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                      {navMode === 'live_gps' ? 'YOU' : 'START'}
                    </div>
                    <div className="w-5 h-5 bg-[#00B67A] border-3 border-black rounded-full shadow-[2px_2px_0px_0px_#000] animate-bounce" />
                  </div>
                </Marker>
              </CampusMap>
            </div>
          </div>

          {/* Quick Details Banner */}
          <div className="bg-white border-3 border-black p-4 neo-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block">Target Hall</span>
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
                className="px-3 py-2 border-2 border-black bg-white font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setIndoorStep(Math.min(indoorStepsArray.length - 1, activeIndoorStep + 1))}
                disabled={activeIndoorStep >= indoorStepsArray.length - 1}
                className="px-4 py-2 border-2 border-black bg-pastel-mint font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] disabled:opacity-40"
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
