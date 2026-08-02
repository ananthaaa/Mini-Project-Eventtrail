import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { RsvpContext } from '../../context/RsvpContext';
import { NavModeContext } from '../../context/NavModeContext';
import { useNavigationStore } from '../../store/navigationStore';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import { useSnapToPath } from '../../hooks/useSnapToPath';
import { useTurnByTurnSteps } from '../../hooks/useTurnByTurnSteps';
import { useDriftDetection } from '../../hooks/useDriftDetection';
import { CampusMap } from '../../components/navigation/CampusMap';
import { ModeToggle } from '../../components/navigation/ModeToggle';
import { TurnByTurnPanel } from '../../components/navigation/TurnByTurnPanel';
import { runAStar } from '../../utils/astar';
import { getDistanceMeters } from '../../utils/bearing';
import { ArrowLeft, Compass, CheckCircle2, MapPin, Building, Sparkles } from 'lucide-react';

// Sample indoor waypoints for SVG floor-plan guidance
const INDOOR_STEPS = [
  { step: 1, title: 'Enter Main Lobby', desc: 'Scan campus ID at turnstile security gate', x: 80, y: 150 },
  { step: 2, title: 'Take North Elevator', desc: 'Proceed to Floor 2 (Auditorium & Labs Block)', x: 250, y: 150 },
  { step: 3, title: 'Arrive at Event Venue', desc: 'Check in at registration desk outside hall', x: 420, y: 150 }
];

export default function NavigateToVenue() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { events, venues } = useContext(RsvpContext) || { events: [], venues: [] };
  const { activeEventId } = useContext(NavModeContext) || {};
  const targetId = eventId || activeEventId || '1';

  // Store actions and state
  const setDestination = useNavigationStore((s) => s.setDestination);
  const setRouteData = useNavigationStore((s) => s.setRouteData);
  const destination = useNavigationStore((s) => s.destination);
  const liveLocation = useNavigationStore((s) => s.liveLocation);
  const snappedLocation = useNavigationStore((s) => s.snappedLocation);
  const routeData = useNavigationStore((s) => s.routeData);

  // Activate navigation hooks
  useLiveLocation();
  useSnapToPath();
  useTurnByTurnSteps();
  useDriftDetection();

  // Local UI state for geofence indoor handoff
  const [isIndoor, setIsIndoor] = useState(false);
  const [indoorStepIdx, setIndoorStepIdx] = useState(0);
  const [completedIndoorSteps, setCompletedIndoorSteps] = useState({});

  // Resolve event and venue coordinates
  const activeEvent = useMemo(() => {
    return events?.find((e) => String(e.id) === String(targetId) || e.id === Number(targetId)) || events?.[0] || {
      id: targetId || 'default',
      title: 'Campus Hackathon 2026',
      venueId: 'main-auditorium',
      locationDetails: { entranceLat: 10.5277, entranceLng: 76.2155 }
    };
  }, [events, targetId]);

  const venueInfo = useMemo(() => {
    if (!activeEvent) return null;
    return venues?.find((v) => v.id === activeEvent.venueId) || {
      name: 'Main Auditorium',
      building: 'Block B (Library & Media Block)',
      floor: '2nd Floor'
    };
  }, [activeEvent]);

  // Initialize destination and initial A* route when event loads
  useEffect(() => {
    const destLat = activeEvent?.locationDetails?.entranceLat || 10.5277;
    const destLng = activeEvent?.locationDetails?.entranceLng || 76.2155;
    const startLat = liveLocation?.lat || 10.5270;
    const startLng = liveLocation?.lng || 76.2144;

    setDestination({
      lat: destLat,
      lng: destLng,
      name: activeEvent.title || venueInfo?.name || 'Event Venue'
    });

    const route = runAStar(null, [startLng, startLat], [destLng, destLat]);
    if (route) {
      setRouteData({
        geometry: route.geometry,
        distance: route.properties.distance || 0,
        steps: []
      });
    }
  }, [activeEvent, venueInfo, setDestination, setRouteData]);

  // Geofence handoff check: auto-switch to indoor mode if within 20m of building radius
  useEffect(() => {
    if (!isIndoor && destination && snappedLocation) {
      const dist = getDistanceMeters(
        [snappedLocation.lng, snappedLocation.lat],
        [destination.lng, destination.lat]
      );
      if (dist < 20) {
        console.log("Geofence entered! Mounting indoor floor plan.");
        setIsIndoor(true);
      }
    }
  }, [snappedLocation, destination, isIndoor]);

  const handleSimulateGeofence = () => {
    setIsIndoor(true);
  };

  const markIndoorStepDone = (idx) => {
    setCompletedIndoorSteps((prev) => ({ ...prev, [idx]: true }));
    if (idx < INDOOR_STEPS.length - 1) {
      setIndoorStepIdx(idx + 1);
    }
  };

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header & Back Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-3 border-black">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-black" />
            </button>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-black uppercase tracking-tight">
                {isIndoor ? 'Indoor Guidance' : 'Campus Navigation'}
              </h1>
              <p className="font-bold text-xs sm:text-sm text-gray-700">
                To: <span className="text-black font-black">{activeEvent.title}</span> • {venueInfo?.building || 'Campus Block'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isIndoor && <ModeToggle />}
          </div>
        </div>

        {/* Outdoor Mode vs Indoor Geofence Handoff */}
        {!isIndoor ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="w-full h-[450px] sm:h-[550px] relative">
                <CampusMap />
              </div>
              <TurnByTurnPanel />
            </div>

            {/* HUD & Geofence Simulation Column */}
            <div className="space-y-6">
              <div className="bg-white border-2 border-black p-6 space-y-4 shadow-[4px_4px_0px_0px_#000]">
                <h3 className="font-display font-black text-xl text-black uppercase border-b-2 border-black pb-2">
                  Navigation HUD
                </h3>
                
                <div className="space-y-3 font-bold text-xs uppercase">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Target Building:</span>
                    <span className="text-black font-black">{venueInfo?.building || 'Main Block'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-gray-600">Remaining Dist:</span>
                    <span className="text-black font-black">{routeData?.distance || 0} meters</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-0.5 bg-secondary-mint text-black border border-black text-[10px]">
                      Outdoor Walking
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSimulateGeofence}
                  className="w-full py-3 bg-secondary-mint border-2 border-black shadow-[3px_3px_0px_0px_#000] font-black text-sm uppercase tracking-wider text-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#000] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>Simulate Geofence Arrival</span>
                </button>
              </div>

              <div className="p-4 bg-primary-yellow/20 border-2 border-black shadow-[3px_3px_0px_0px_#000] text-xs font-bold text-black uppercase leading-relaxed">
                💡 Entering within 20m of the building radius will automatically trigger geofence handoff to indoor floor-plan navigation.
              </div>
            </div>
          </div>
        ) : (
          /* Indoor SVG Floor-Plan Guidance */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_#000] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-6 h-6 text-black" />
                  <h3 className="font-display font-black text-xl text-black uppercase">
                    Indoor Floor Plan ({venueInfo?.floor || '2nd Floor'})
                  </h3>
                </div>
                <button
                  onClick={() => setIsIndoor(false)}
                  className="text-xs font-bold text-gray-700 underline uppercase"
                >
                  Return to Outdoor Map
                </button>
              </div>

              <div className="w-full aspect-[4/3] bg-[#fffbf0] relative overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <svg viewBox="0 0 500 300" className="w-full h-full">
                  {/* Floor perimeter */}
                  <rect x="20" y="20" width="460" height="260" fill="none" stroke="#000" strokeWidth="3" />
                  
                  {/* Rooms */}
                  <rect x="50" y="50" width="100" height="200" fill="#e5e5e5" stroke="#000" strokeWidth="2" />
                  <text x="100" y="155" fontSize="11" fontWeight="bold" fill="#000" textAnchor="middle">MAIN LOBBY</text>
                  
                  <rect x="190" y="50" width="120" height="90" fill="#e5e5e5" stroke="#000" strokeWidth="2" />
                  <text x="250" y="98" fontSize="11" fontWeight="bold" fill="#000" textAnchor="middle">ELEVATORS</text>
                  
                  <rect x="350" y="50" width="110" height="200" fill="#00f5d4" stroke="#000" strokeWidth="2" />
                  <text x="405" y="155" fontSize="11" fontWeight="black" fill="#000" textAnchor="middle">EVENT HALL</text>

                  {/* Connecting path */}
                  <path d="M 100 150 L 250 150 L 405 150" fill="none" stroke="#ffbe0b" strokeWidth="6" strokeDasharray="6,6" />

                  {/* Waypoint circles */}
                  {INDOOR_STEPS.map((wp, idx) => {
                    const isActive = idx === indoorStepIdx;
                    const isDone = completedIndoorSteps[idx];
                    return (
                      <g key={wp.step} className="cursor-pointer" onClick={() => setIndoorStepIdx(idx)}>
                        <circle
                          cx={wp.x}
                          cy={wp.y}
                          r={isActive ? "16" : "12"}
                          fill={isActive ? "#ffbe0b" : isDone ? "#00f5d4" : "#fff"}
                          stroke="#000"
                          strokeWidth="3"
                        />
                        <text
                          x={wp.x}
                          y={wp.y + 4}
                          fontSize="10"
                          fontWeight="black"
                          fill="#000"
                          textAnchor="middle"
                        >
                          {wp.step}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Indoor Step Tracker & Action */}
            <div className="bg-white border-2 border-black p-6 space-y-4 shadow-[4px_4px_0px_0px_#000]">
              <h4 className="font-display font-black text-lg text-black uppercase border-b-2 border-black pb-2">
                Indoor Waypoints
              </h4>
              <div className="space-y-3">
                {INDOOR_STEPS.map((wp, idx) => {
                  const isActive = idx === indoorStepIdx;
                  const isDone = completedIndoorSteps[idx];
                  return (
                    <div
                      key={wp.step}
                      onClick={() => setIndoorStepIdx(idx)}
                      className={`p-3 border-2 border-black cursor-pointer transition-all ${
                        isActive
                          ? 'bg-primary-yellow shadow-[3px_3px_0px_0px_#000]'
                          : isDone
                          ? 'bg-secondary-mint/40 opacity-80'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between font-black text-xs uppercase mb-1">
                        <span>Step {wp.step}: {wp.title}</span>
                        {isDone && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </div>
                      <p className="text-[11px] font-bold text-gray-800">{wp.desc}</p>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => markIndoorStepDone(indoorStepIdx)}
                className="w-full py-3 bg-[#00f5d4] border-2 border-black shadow-[3px_3px_0px_0px_#000] font-black text-sm uppercase tracking-wider text-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                Mark Step {indoorStepIdx + 1} Complete
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
