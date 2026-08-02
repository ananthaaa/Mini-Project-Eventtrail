import React, { useState, useContext, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../components/layout/PageShell';
import { RsvpContext } from '../../context/RsvpContext';
import { createVenue } from '../../services/apiService';
import ImageUploadZone from '../../components/ui/ImageUploadZone';
import { ArrowLeft, Plus, Trash2, Save, MapPin, X } from 'lucide-react';
import { Marker } from 'react-map-gl/mapbox';
import CampusMap from '../../components/ui/CampusMap';

const AdminVenueUpload = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const { events } = useContext(RsvpContext);

  const eventId = searchParams.get('eventId') || (events[0]?.id || '');
  const [selectedEventId, setSelectedEventId] = useState(eventId);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId);
  }, [events, selectedEventId]);

  const initialVenue = useMemo(() => {
    if (!selectedEvent) return null;
    return mockVenues.find((v) => v.id === selectedEvent.venueId) || mockVenues[0];
  }, [selectedEvent]);

  const [waypoints, setWaypoints] = useState(() => {
    return initialVenue ? initialVenue.waypoints : [];
  });
  const [building, setBuilding] = useState(() => {
    return initialVenue ? initialVenue.building : 'Science Building Block B';
  });

  const [mapPosition, setMapPosition] = useState({ lat: 10.177975, lng: 76.431153 });
  const [indoorSteps, setIndoorSteps] = useState([
    'Enter main entrance',
    'Turn left at reception desk',
    'Take the staircase on the right to Floor 2',
    'Walk to the end of the corridor',
    'Room 204 is the third door on the right'
  ]);

  const handleAddIndoorStep = () => {
    setIndoorSteps((prev) => [...prev, '']);
  };

  const handleRemoveIndoorStep = (idx) => {
    setIndoorSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleIndoorStepChange = (idx, value) => {
    setIndoorSteps((prev) =>
      prev.map((step, i) => (i === idx ? value : step))
    );
  };

  const [svgUrl, setSvgUrl] = useState('');

  const [newInstruction, setNewInstruction] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newX, setNewX] = useState(150);
  const [newY, setNewY] = useState(150);

  const handleEventChange = (e) => {
    const evId = e.target.value;
    setSelectedEventId(evId);
    const ev = events.find((item) => item.id === evId);
    const ven = mockVenues.find((v) => v.id === ev?.venueId) || mockVenues[0];
    if (ven) {
      setWaypoints(ven.waypoints);
      setBuilding(ven.building);
    }
  };

  const handleAddWaypoint = () => {
    if (!newInstruction) return;

    const nextStep = waypoints.length + 1;
    const newWp = {
      step: nextStep,
      instruction: newInstruction,
      details: newDetails,
      x: parseInt(newX),
      y: parseInt(newY)
    };

    setWaypoints((prev) => [...prev, newWp]);
    setNewInstruction('');
    setNewDetails('');
    setNewX(150);
    setNewY(150);
  };

  const handleDeleteWaypoint = (stepNum) => {
    setWaypoints((prev) =>
      prev
        .filter((wp) => wp.step !== stepNum)
        .map((wp, idx) => ({ ...wp, step: idx + 1 }))
    );
  };

  const handleSaveConfiguration = async (e) => {
    e.preventDefault();
    if (!building) return alert('Building name is required.');

    const newVenue = {
      name: building,
      category: 'Campus',
      description: 'Automatically created from Admin Setup',
      floorPlanImage: svgUrl,
      graphData: {
        indoorSteps,
        mapPosition,
        waypoints
      }
    };

    setIsSubmitting(true);
    try {
      await createVenue(newVenue);
      alert(`Configuration saved for venue: ${building}.`);
      navigate('/admin');
    } catch (error) {
      console.error('Error saving venue:', error);
      alert('Failed to save venue. ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-6 flex">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-black uppercase tracking-wider hover:underline underline-offset-4 decoration-2"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-12 bg-white border-3 border-black p-8 neo-shadow max-w-4xl">
        <h1 className="font-display font-black text-4xl text-black tracking-tight uppercase mb-2">
          Venue Setup
        </h1>
        <p className="text-black/70 font-bold uppercase tracking-wider text-sm">Configure floor plans and navigation waypoints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-3 border-black p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 neo-shadow"
          >
            <div className="grow">
              <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Target Event:</label>
              <select
                value={selectedEventId}
                onChange={handleEventChange}
                className="w-full bg-white border-3 border-black px-4 py-3 text-black font-medium focus:outline-none focus:bg-pastel-yellow shadow-[4px_4px_0px_0px_#000] transition-colors"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>{evt.title}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-black text-black uppercase tracking-wider mb-2">Building:</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full bg-white border-3 border-black px-4 py-3 text-black font-medium focus:outline-none focus:bg-pastel-yellow shadow-[4px_4px_0px_0px_#000] transition-colors"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-3 border-black p-6 md:p-8 space-y-6 neo-shadow"
          >
            <h2 className="font-display font-black text-2xl text-black uppercase">1. Map & Indoor Directions</h2>

            <div className="bg-white border-3 border-black mb-6 shadow-[4px_4px_0px_0px_#000]">
              <div className="p-4 border-b-3 border-black flex justify-between items-center bg-white">
                <span className="font-medium text-text-primary flex items-center gap-2">
                  <MapPin size={18} className="text-accent" />
                  Building Entrance Pin
                </span>
                <span className="text-sm text-text-secondary font-mono">
                  {mapPosition.lat.toFixed(6)}, {mapPosition.lng.toFixed(6)}
                </span>
              </div>
              <div className="h-80 w-full relative z-0">
                <CampusMap onLocationSelect={setMapPosition}>
                  {mapPosition && (
                    <Marker 
                      longitude={mapPosition.lng} 
                      latitude={mapPosition.lat} 
                      draggable={true} 
                      onDragEnd={(e) => setMapPosition({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
                    >
                      <div className="w-6 h-6 bg-accent-yellow border-3 border-black rounded-full shadow-[2px_2px_0px_0px_#000] cursor-move flex items-center justify-center font-black text-[10px] text-black">
                        ★
                      </div>
                    </Marker>
                  )}
                </CampusMap>
              </div>
              <div className="p-4 text-sm text-text-secondary">
                Click anywhere on the map to set the entrance marker. Drag the marker to fine-tune its position.
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t-3 border-black">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-black text-black uppercase tracking-wider">Indoor Directions</label>
                <button
                  type="button"
                  onClick={handleAddIndoorStep}
                  className="flex items-center gap-2 text-sm font-black bg-pastel-mint border-3 border-black hover:-translate-y-1 text-black px-4 py-2 uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] transition-all"
                >
                  <Plus size={14} /> Add Step
                </button>
              </div>

              {indoorSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-white border-3 border-black p-3 shadow-[2px_2px_0px_0px_#000]">
                  <span className="font-bold text-text-tertiary w-6 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleIndoorStepChange(idx, e.target.value)}
                    placeholder="Describe the step..."
                    className="grow bg-transparent border-none text-sm text-text-primary focus:outline-none"
                  />
                  {indoorSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIndoorStep(idx)}
                      className="text-text-tertiary hover:text-red-500 transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-3 border-black p-6 md:p-8 space-y-6 neo-shadow"
          >
            <h2 className="font-display font-black text-2xl text-black uppercase">2. Floor Plan SVG Upload</h2>
            <ImageUploadZone 
              onUpload={setSvgUrl} 
              previewUrl={svgUrl} 
              onClear={() => setSvgUrl('')} 
            />

            <div className="border-3 border-black aspect-[4/3] w-full max-w-xl mx-auto bg-pastel-yellow relative flex items-center justify-center shadow-[4px_4px_0px_0px_#000]">
              <svg className="w-full h-full" viewBox="0 0 500 350">
                {[...Array(7)].map((_, i) => (
                  <line key={i} x1={(i + 1) * 60} y1="0" x2={(i + 1) * 60} y2="350" stroke="#333" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                ))}
                {[...Array(5)].map((_, i) => (
                  <line key={`y-${i}`} x1="0" y1={(i + 1) * 60} x2="500" y2={(i + 1) * 60} stroke="#333" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                ))}
                <rect x="15" y="15" width="470" height="320" fill="none" stroke="#444" strokeWidth="2" />
                <rect x="50" y="50" width="100" height="250" fill="#222" stroke="#333" strokeWidth="1" />
                <rect x="150" y="50" width="200" height="100" fill="#222" stroke="#333" strokeWidth="1" />
                <rect x="350" y="50" width="100" height="250" fill="#222" stroke="#333" strokeWidth="1" />

                {waypoints.length > 1 && (
                  <path
                    d={waypoints.map((wp, i) => `${i === 0 ? 'M' : 'L'} ${wp.x} ${wp.y}`).join(' ')}
                    fill="none"
                    stroke="#000"
                    strokeWidth="4"
                    strokeDasharray="8,8"
                  />
                )}

                {waypoints.map((wp) => (
                  <g key={wp.step}>
                    <circle cx={wp.x} cy={wp.y} r="12" fill="#FF5A1F" stroke="#0B0B0C" strokeWidth="3" />
                    <text x={wp.x} y={wp.y + 4} fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif" fill="#fff" textAnchor="middle">{wp.step}</text>
                  </g>
                ))}
              </svg>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-bg-surface border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 sticky top-24"
          >
            <h2 className="font-display font-bold text-xl text-text-primary border-b border-border-subtle pb-4">
              3. Waypoints
            </h2>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {waypoints.map((wp) => (
                <div key={wp.step} className="flex justify-between items-center border border-border-subtle rounded-xl p-4 bg-bg-primary">
                  <div>
                    <span className="font-medium text-text-primary block mb-1">
                      {wp.step}. {wp.instruction}
                    </span>
                    <span className="text-text-tertiary text-xs block">X: {wp.x}, Y: {wp.y}</span>
                  </div>
                  <button onClick={() => handleDeleteWaypoint(wp.step)} className="text-text-tertiary hover:text-red-500 transition-colors p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {waypoints.length === 0 && (
                <div className="text-center p-6 border border-border-subtle border-dashed rounded-xl text-text-tertiary">
                  No waypoints configured.
                </div>
              )}
            </div>

            <div className="border-t border-border-subtle pt-6 space-y-4">
              <label className="block text-sm font-black text-black uppercase tracking-wider">Add New Waypoint</label>
              
              <input type="text" value={newInstruction} onChange={(e) => setNewInstruction(e.target.value)} placeholder="Instruction (e.g. Turn right)" className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
              <input type="text" value={newDetails} onChange={(e) => setNewDetails(e.target.value)} placeholder="Details (e.g. Near elevators)" className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">X Coord (px)</label>
                  <input type="number" value={newX} onChange={(e) => setNewX(e.target.value)} className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-accent" min="20" max="480" />
                </div>
                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">X Coord</label>
                  <input type="number" value={newX} onChange={(e) => setNewX(e.target.value)} className="w-full bg-white border-3 border-black px-3 py-2 text-sm text-black font-mono font-bold focus:outline-none" min="20" max="480" />
                </div>
                <div>
                  <label className="block text-xs font-black text-black uppercase mb-1">Y Coord</label>
                  <input type="number" value={newY} onChange={(e) => setNewY(e.target.value)} className="w-full bg-white border-3 border-black px-3 py-2 text-sm text-black font-mono font-bold focus:outline-none" min="20" max="330" />
                </div>
              </div>

              <button onClick={handleAddWaypoint} className="w-full bg-pastel-mint border-3 border-black text-black px-6 py-3 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] transition-all flex items-center justify-center gap-2">
                <Plus size={16} /> Add Waypoint
              </button>
            </div>

            <div className="border-t-3 border-black pt-6">
              <button disabled={isSubmitting} onClick={handleSaveConfiguration} className={`w-full bg-pastel-peach border-3 border-black text-black px-8 py-3 font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Setup'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
};

export default AdminVenueUpload;
