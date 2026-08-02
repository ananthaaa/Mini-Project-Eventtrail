import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import { NavModeContext } from '../context/NavModeContext';
import { RsvpContext } from '../context/RsvpContext';
import { NotificationContext } from '../context/NotificationContext';
import StepTracker from '../components/ui/StepTracker';
import { MapPin, Navigation, CheckCircle2, ChevronRight, ArrowLeft, Info, Compass } from 'lucide-react';
import { Marker } from 'react-map-gl/mapbox';
import CampusMap from '../components/ui/CampusMap';
import RouteLayer from '../components/ui/RouteLayer';
import { fetchPathNodes, fetchPathEdges } from '../services/mapService';
import { buildAdjacencyList, findPathAStar } from '../utils/pathfinding';

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
  const {
    activeEventId,
    currentPhase,
    outdoorProgress,
    outdoorStatus,
    activeIndoorStep,
    completedIndoorSteps,
    setOutdoorProgress,
    setOutdoorStatus,
    simulateArrival,
    setIndoorStep,
    markIndoorStepCompleted,
    finishNavigation,
    resetNavigation,
  } = useContext(NavModeContext);

  const { events, venues } = useContext(RsvpContext);
  const { addNotification } = useContext(NotificationContext);

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId);
  }, [events, activeEventId]);

  const venue = useMemo(() => {
    if (!activeEvent) return null;
    return venues.find((v) => v.id === activeEvent.venueId);
  }, [activeEvent, venues]);

  const progressRef = useRef(outdoorProgress);
  useEffect(() => {
    progressRef.current = outdoorProgress;
  }, [outdoorProgress]);

  const startLat = 10.1768;
  const startLng = 76.4290;
  const destLat = activeEvent?.locationDetails?.entranceLat || 10.1788;
  const destLng = activeEvent?.locationDetails?.entranceLng || 76.4320;

  const [currentLat, setCurrentLat] = useState(startLat);
  const [currentLng, setCurrentLng] = useState(startLng);
  const [distanceRemaining, setDistanceRemaining] = useState(haversineDistance(startLat, startLng, destLat, destLng));

  const [nodes, setNodes] = useState(null);
  const [adjacency, setAdjacency] = useState(null);
  const [computedPath, setComputedPath] = useState(null);
  const [pathError, setPathError] = useState('');

  useEffect(() => {
    async function loadGraph() {
      try {
        const fetchedNodes = await fetchPathNodes();
        const fetchedEdges = await fetchPathEdges();
        setNodes(fetchedNodes);
        setAdjacency(buildAdjacencyList(fetchedEdges));
      } catch (e) {
        console.error("Failed to load map data", e);
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
    if (nodes && adjacency && currentPhase === 'outdoor') {
      const startNodeId = getClosestNode(startLat, startLng, nodes);
      const destNodeId = getClosestNode(destLat, destLng, nodes);
      
      const path = findPathAStar(startNodeId, destNodeId, adjacency, nodes);
      if (path) {
        setComputedPath(path);
        setPathError('');
      } else {
        setComputedPath(null);
        setPathError('No valid walking route found between these locations.');
      }
    }
  }, [nodes, adjacency, startLat, startLng, destLat, destLng, currentPhase]);


  useEffect(() => {
    let timer;
    if (currentPhase === 'outdoor' && progressRef.current < 100) {
      timer = setInterval(() => {
        const current = progressRef.current;
        if (current >= 100) {
          clearInterval(timer);
          return;
        }
        const next = Math.min(current + 2, 100);
        progressRef.current = next;
        setOutdoorProgress(next);

        const fraction = next / 100;
        const newLat = startLat + (destLat - startLat) * fraction;
        const newLng = startLng + (destLng - startLng) * fraction;
        setCurrentLat(newLat);
        setCurrentLng(newLng);

        const dist = haversineDistance(newLat, newLng, destLat, destLng);
        setDistanceRemaining(dist);

        if (dist <= 30) {
          clearInterval(timer);
          setOutdoorStatus("Arrived at building boundary! Handoff active.");
          addNotification("Geofence Boundary Reached. Switching from Outdoor GPS to Indoor Map...", "success");
          setTimeout(() => {
            simulateArrival();
          }, 3000);
        } else if (dist < 100) {
          setOutdoorStatus("Approaching building entrance...");
        } else if (dist < 300) {
          setOutdoorStatus("Walking down Campus Mall corridor...");
        } else {
          setOutdoorStatus("Leaving student union square...");
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentPhase, destLat, destLng]);

  if (!activeEvent || !venue) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20">
          <div className="w-16 h-16 bg-bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-6">
            <Navigation className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-display font-bold text-3xl text-text-primary mb-4">No Active Navigation</h3>
          <p className="text-text-secondary mb-8">
            You must claim a ticket and click "Launch Navigator" to start your route.
          </p>
          <Link to="/discover" className="inline-flex items-center gap-2 bg-bg-surface border border-border-subtle px-6 py-3 rounded-full text-text-primary hover:text-accent transition-colors">
            Browse Live Events
          </Link>
        </div>
      </PageShell>
    );
  }

  const indoorStepsArray = activeEvent?.locationDetails?.indoorSteps 
    ? activeEvent.locationDetails.indoorSteps.map((s, idx) => ({ step: idx + 1, instruction: s, x: 250, y: 150 })) 
    : venue.waypoints;

  const pathDValue = indoorStepsArray
    .map((wp, idx) => `${idx === 0 ? 'M' : 'L'} ${wp.x} ${wp.y}`)
    .join(' ');

  const currentWaypoint = indoorStepsArray[activeIndoorStep] || null;
  const isLastIndoorStep = activeIndoorStep === indoorStepsArray.length - 1;
  const isNavCompleted = currentPhase === 'arrived';

  const handleNextStep = () => {
    markIndoorStepCompleted(activeIndoorStep, true);
    if (isLastIndoorStep) {
      finishNavigation();
    } else {
      setIndoorStep(activeIndoorStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (activeIndoorStep > 0) {
      setIndoorStep(activeIndoorStep - 1);
    }
  };

  return (
    <PageShell>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs uppercase tracking-wider font-medium">Phase: {currentPhase.toUpperCase()}</span>
            <span className="px-3 py-1 rounded-full bg-bg-surface border border-border-subtle text-text-primary text-xs uppercase tracking-wider font-medium">{venue.building}</span>
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-text-primary tracking-tight">
            Routing to {activeEvent.title}
          </h1>
        </div>
        <button
          onClick={resetNavigation}
          className="px-4 py-2 text-sm font-medium text-text-tertiary hover:text-red-400 bg-bg-surface hover:bg-bg-primary border border-border-subtle rounded-full transition-colors"
        >
          Cancel Navigation
        </button>
      </div>

      {currentPhase === 'outdoor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border-3 border-black h-[500px] relative z-0 neo-shadow-lg">
              <CampusMap center={[(startLat + destLat)/2, (startLng + destLng)/2]}>
                {pathError && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 border-2 border-red-500 text-red-700 px-4 py-2 z-[1000] font-bold shadow-md">
                    {pathError}
                  </div>
                )}
                <Marker longitude={destLng} latitude={destLat} anchor="bottom">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#FF5A1F] text-white text-[9px] font-black uppercase px-1.5 py-0.5 border border-black shadow-sm mb-1">
                      TARGET
                    </div>
                    <div className="w-5 h-5 bg-[#FF5A1F] border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000] animate-pulse" />
                  </div>
                </Marker>
                <Marker longitude={currentLng} latitude={currentLat} anchor="center">
                  <div className="w-5 h-5 bg-[#007bff] border-3 border-white rounded-full shadow-[0_0_12px_rgba(0,123,255,0.9)] animate-bounce" />
                </Marker>
                <RouteLayer path={computedPath} nodes={nodes} />
              </CampusMap>

              <div className="absolute bottom-6 left-6 right-6 bg-white border-3 border-black p-5 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 shadow-[4px_4px_0px_0px_#000]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pastel-yellow border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000]">
                    <Compass className="w-6 h-6 animate-spin-slow" strokeWidth={3} />
                  </div>
                  <div>
                    <span className="font-black text-black uppercase tracking-wider block text-lg">{outdoorStatus}</span>
                    <span className="text-sm font-bold text-black/70 uppercase">Walking Route Active</span>
                  </div>
                </div>
                <div className="bg-pastel-mint border-3 border-black px-4 py-2 text-black font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                  {Math.round(distanceRemaining)}m remaining
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border-3 border-black p-8 space-y-6 neo-shadow">
              <h3 className="font-display font-black text-2xl text-black uppercase">Outdoor Navigation HUD</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-3 border-black border-dashed pb-3">
                  <span className="text-black/70 font-bold uppercase tracking-wider text-xs">Target Building</span>
                  <span className="text-black font-black uppercase tracking-wider">{venue.building}</span>
                </div>
                <div className="flex justify-between items-center border-b-3 border-black border-dashed pb-3">
                  <span className="text-black/70 font-bold uppercase tracking-wider text-xs">GPS Distance</span>
                  <span className="text-black font-black uppercase tracking-wider">{Math.round(distanceRemaining)} metres</span>
                </div>
                <div className="flex justify-between items-center pb-3">
                  <span className="text-black/70 font-bold uppercase tracking-wider text-xs">Estimated walk</span>
                  <span className="text-black font-black uppercase tracking-wider">{venue.timeEstimation}</span>
                </div>
              </div>

              <button
                onClick={simulateArrival}
                className="w-full bg-pastel-mint border-3 border-black text-black font-black uppercase tracking-wider py-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all"
              >
                Simulate Geofence Arrival
              </button>
            </div>

            <div className="bg-pastel-peach border-3 border-black p-6 flex gap-4 items-start neo-shadow-sm">
              <Info size={24} className="text-black shrink-0 mt-1" strokeWidth={3} />
              <p className="text-sm text-black font-bold leading-relaxed uppercase tracking-wide">
                The app is simulating your walking coordinates. In a production build, your device's background GPS coordinates will trigger the geofence to switch automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {(currentPhase === 'indoor' || isNavCompleted) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border-3 border-black p-6 neo-shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-black text-2xl text-black uppercase">Indoor Waypoint Map (2nd Floor Block B)</h3>
              </div>

              <div className="w-full aspect-[4/3] bg-pastel-yellow relative overflow-hidden border-3 border-black shadow-[4px_4px_0px_0px_#000]">
                <svg viewBox="0 0 500 350" className="w-full h-full">
                  <rect x="20" y="20" width="460" height="310" fill="none" stroke="#333" strokeWidth="2" />
                  
                  <rect x="50" y="50" width="100" height="250" fill="#222" stroke="#333" strokeWidth="1" />
                  <rect x="150" y="50" width="200" height="100" fill="#222" stroke="#333" strokeWidth="1" />
                  <rect x="350" y="50" width="100" height="250" fill="#222" stroke="#333" strokeWidth="1" />
                  
                  <line x1="150" y1="150" x2="350" y2="150" stroke="#333" strokeWidth="1" />
                  
                  <text x="100" y="295" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif" fill="#666" textAnchor="middle">UNION CAFE</text>
                  <text x="250" y="125" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif" fill="#666" textAnchor="middle">RESEARCH GALLERY</text>
                  <text x="400" y="295" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif" fill="#666" textAnchor="middle">{activeEvent.venueId === 'science-hall-a' ? 'AUDITORIUM A' : 'HUB ROOM 202'}</text>

                  <path
                    d={pathDValue}
                    fill="none"
                    stroke="#FF5A1F"
                    strokeWidth="4"
                    strokeDasharray="8,8"
                    opacity="0.5"
                  />

                  {indoorStepsArray.map((wp, idx) => {
                    const isActive = idx === activeIndoorStep && !isNavCompleted;
                    const isCompleted = completedIndoorSteps[idx] || isNavCompleted;
                    
                    return (
                      <g key={wp.step} className="cursor-pointer" onClick={() => setIndoorStep(idx)}>
                        <circle
                          cx={wp.x}
                          cy={wp.y}
                          r={isActive ? "14" : "10"}
                          fill={isActive ? "#FFDB58" : isCompleted ? "#00B67A" : "#151517"}
                          stroke={isActive ? "#0B0B0C" : isCompleted ? "#0B0B0C" : "#444"}
                          strokeWidth="2"
                        />
                        <text
                          x={wp.x}
                          y={wp.y + 3}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="Inter, sans-serif"
                          fill={isActive ? "#000" : "#fff"}
                          textAnchor="middle"
                        >
                          {wp.step}
                        </text>
                        
                        {isActive && (
                          <circle
                            cx={wp.x}
                            cy={wp.y}
                            r="24"
                            fill="none"
                            stroke="#FFDB58"
                            strokeWidth="2"
                            className="animate-ping"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {isNavCompleted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-pastel-mint border-3 border-black p-8 text-center space-y-6 neo-shadow"
              >
                <div className="w-20 h-20 bg-white border-3 border-black flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#000]">
                  <CheckCircle2 className="w-10 h-10 text-black" strokeWidth={3} />
                </div>
                <div>
                  <h3 className="font-display font-black text-3xl text-black uppercase tracking-tight mb-3">You Have Arrived!</h3>
                  <p className="text-black font-bold uppercase tracking-wide leading-relaxed">
                    You have reached the venue destination. Present your ticket barcode to the host organizer to scan and check in. Enjoy the event!
                  </p>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <button
                    onClick={() => navigate(`/student/rsvp-confirmation/${activeEvent.id}`)}
                    className="w-full bg-pastel-yellow border-3 border-black text-black font-black uppercase tracking-wider py-4 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all"
                  >
                    Show Ticket Barcode
                  </button>
                  <button
                    onClick={() => {
                      resetNavigation();
                      navigate('/');
                    }}
                    className="w-full bg-white border-3 border-black text-black font-black uppercase tracking-wider py-4 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all"
                  >
                    Finish Journey
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border-3 border-black p-8 neo-shadow">
                <h3 className="font-display font-black text-2xl text-black uppercase mb-6">Navigation Steps</h3>
                
                <div className="mb-8">
                  <StepTracker 
                    steps={indoorStepsArray}
                    activeStepIndex={activeIndoorStep}
                    completedSteps={completedIndoorSteps}
                    onStepClick={setIndoorStep}
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t-3 border-black border-dashed">
                  <button
                    onClick={handlePrevStep}
                    disabled={activeIndoorStep === 0}
                    className="flex-1 py-3 px-4 bg-white border-3 border-black disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-3 px-4 bg-pastel-mint border-3 border-black text-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-all"
                  >
                    {activeIndoorStep === indoorStepsArray.length - 1 ? 'Finish' : 'Next Step'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Navigate;
