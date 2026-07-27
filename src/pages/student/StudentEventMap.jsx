import React, { useState, useContext, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import CampusMap from '../../components/ui/CampusMap';
import { RsvpContext } from '../../context/RsvpContext';
import { NavModeContext } from '../../context/NavModeContext';
import { Marker, Popup } from 'react-map-gl/mapbox';
import { 
  Calendar, 
  MapPin, 
  Navigation, 
  Zap, 
  Trophy, 
  BookOpen, 
  Palette, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  Users,
  Clock
} from 'lucide-react';

const getCategoryStyle = (cat) => {
  switch (cat?.toLowerCase()) {
    case 'tech':
      return { bg: '#00E5FF', icon: Zap, label: 'Tech' };
    case 'sports':
      return { bg: '#00B67A', icon: Trophy, label: 'Sports' };
    case 'academic':
      return { bg: '#FFDB58', icon: BookOpen, label: 'Academic' };
    default:
      return { bg: '#FF5A1F', icon: Palette, label: cat || 'General' };
  }
};

const StudentEventMap = () => {
  const navigate = useNavigate();
  const { events, venues } = useContext(RsvpContext);
  const { startNavigation } = useContext(NavModeContext);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [adminMarkedOnly, setAdminMarkedOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Map events to outdoor coordinates
  const eventsWithCoords = useMemo(() => {
    return events.map((event) => {
      let lat = null;
      let lng = null;
      let isAdminCustom = false;

      if (event.locationDetails && event.locationDetails.entranceLat && event.locationDetails.entranceLng) {
        lat = event.locationDetails.entranceLat;
        lng = event.locationDetails.entranceLng;
        isAdminCustom = true;
      } else if (event.venueId) {
        const venueObj = venues.find((v) => v.id === event.venueId);
        if (venueObj && venueObj.outdoorCoordinates) {
          lat = venueObj.outdoorCoordinates[0];
          lng = venueObj.outdoorCoordinates[1];
        }
      }

      return {
        ...event,
        lat,
        lng,
        isAdminCustom
      };
    }).filter(e => e.lat !== null && e.lng !== null);
  }, [events, venues]);

  const filteredEvents = useMemo(() => {
    return eventsWithCoords.filter((e) => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (adminMarkedOnly && !e.isAdminCustom && !e.locationDetails) return false;
      return true;
    });
  }, [eventsWithCoords, selectedCategory, adminMarkedOnly]);

  const handleStartNav = (eventId) => {
    startNavigation(eventId);
    navigate('/student/navigate');
  };

  return (
    <PageShell>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-pastel-mint border-2 border-black text-black text-xs uppercase tracking-wider font-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Explorer
            </span>
            <span className="px-3 py-1 rounded-full bg-accent-yellow border-2 border-black text-black text-xs uppercase tracking-wider font-black shadow-[2px_2px_0px_0px_#000]">
              {filteredEvents.length} Events Georeferenced
            </span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl text-black tracking-tight uppercase">
            Student Event Map
          </h1>
          <p className="text-black/70 font-bold mt-2 max-w-2xl">
            Discover campus happenings in real-time. Click any event pin to view live RSVP status, venue building details, and launch direct GPS walking navigation.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border-3 border-black p-4 mb-8 neo-shadow flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase mr-2 flex items-center gap-1.5 text-black/70">
            <Filter className="w-4 h-4 text-black" strokeWidth={3} /> Filter Category:
          </span>
          {['All', 'Tech', 'Sports', 'Academic', 'Arts'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 border-2 border-black font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_#000] ${
                selectedCategory === cat
                  ? 'bg-black text-white translate-y-px shadow-[1px_1px_0px_0px_#000]'
                  : 'bg-white text-black hover:bg-pastel-yellow'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-pastel-peach border-2 border-black px-4 py-1.5 shadow-[2px_2px_0px_0px_#000]">
          <input
            type="checkbox"
            id="adminToggle"
            checked={adminMarkedOnly}
            onChange={(e) => setAdminMarkedOnly(e.target.checked)}
            className="w-4 h-4 accent-black border-2 border-black cursor-pointer"
          />
          <label htmlFor="adminToggle" className="text-xs font-black uppercase text-black cursor-pointer select-none flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} /> Admin Verified Pins Only
          </label>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white border-3 border-black h-[650px] relative z-0 neo-shadow-lg">
            <CampusMap center={[10.1785, 76.4308]} zoom={17}>
              {filteredEvents.map((event) => {
                const styleObj = getCategoryStyle(event.category);
                const IconComponent = styleObj.icon;
                const isSelected = selectedEvent?.id === event.id;

                return (
                  <Marker
                    key={event.id}
                    longitude={event.lng}
                    latitude={event.lat}
                    anchor="bottom"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setSelectedEvent(event);
                    }}
                  >
                    <div className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-110">
                      {event.isAdminCustom && (
                        <div className="bg-black text-white text-[9px] font-black uppercase px-1.5 py-0.5 border border-white shadow-sm mb-1 flex items-center gap-1">
                          ★ ADMIN PIN
                        </div>
                      )}
                      <div 
                        className={`w-10 h-10 border-3 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_#000] transition-all ${
                          isSelected ? 'scale-125 ring-4 ring-black animate-pulse' : ''
                        }`}
                        style={{ backgroundColor: styleObj.bg }}
                        title={`${event.title} (${event.category})`}
                      >
                        <IconComponent className="w-5 h-5 text-black" strokeWidth={2.5} />
                      </div>
                      <div className="bg-white border-2 border-black px-2 py-0.5 mt-1 shadow-[2px_2px_0px_0px_#000] max-w-[120px] truncate text-[10px] font-black text-black">
                        {event.title}
                      </div>
                    </div>
                  </Marker>
                );
              })}

              {/* Interactive Event Popover Modal */}
              {selectedEvent && (
                <Popup
                  longitude={selectedEvent.lng}
                  latitude={selectedEvent.lat}
                  anchor="top"
                  offset={20}
                  onClose={() => setSelectedEvent(null)}
                  className="neo-mapbox-popup !max-w-[320px]"
                  closeOnClick={false}
                >
                  <div className="p-1 w-[280px]">
                    <div className="relative h-28 border-2 border-black mb-3 overflow-hidden">
                      <img
                        src={selectedEvent.coverImage}
                        alt={selectedEvent.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-accent-yellow border border-black text-black font-black uppercase text-[10px] shadow-[1px_1px_0px_0px_#000]">
                        {selectedEvent.category}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-base text-black uppercase leading-tight mb-2">
                      {selectedEvent.title}
                    </h3>

                    <div className="space-y-1.5 text-xs font-bold text-black/80 mb-4 bg-[#F9F5F6] p-2.5 border border-black">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-black shrink-0" strokeWidth={2.5} />
                        <span className="truncate">{selectedEvent.date} • {selectedEvent.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-black shrink-0" strokeWidth={2.5} />
                        <span className="truncate">
                          {venues.find(v => v.id === selectedEvent.venueId)?.name || 'Campus Venue'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-black shrink-0" strokeWidth={2.5} />
                        <span>{selectedEvent.seatsAvailable} / {selectedEvent.seatsTotal} seats open</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleStartNav(selectedEvent.id)}
                        className="w-full bg-pastel-mint border-2 border-black py-2 font-black text-xs uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" strokeWidth={3} /> Route Here Now
                      </button>
                      <button
                        onClick={() => navigate(`/student/events/${selectedEvent.id}`)}
                        className="w-full bg-white border-2 border-black py-2 font-black text-xs uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-yellow transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={3} /> View Full Details
                      </button>
                    </div>
                  </div>
                </Popup>
              )}
            </CampusMap>

            {/* Map Category Legend Footer */}
            <div className="absolute bottom-6 left-6 right-6 bg-white border-3 border-black p-4 flex flex-wrap justify-between items-center gap-4 z-10 shadow-[4px_4px_0px_0px_#000]">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-black inline-block" style={{ backgroundColor: '#00E5FF' }}></span>
                <span className="text-xs font-black uppercase">Tech</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-black inline-block" style={{ backgroundColor: '#00B67A' }}></span>
                <span className="text-xs font-black uppercase">Sports</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-black inline-block" style={{ backgroundColor: '#FFDB58' }}></span>
                <span className="text-xs font-black uppercase">Academic</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-black inline-block" style={{ backgroundColor: '#FF5A1F' }}></span>
                <span className="text-xs font-black uppercase">Arts & Other</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase">
                ★ Admin Verified Pin
              </div>
            </div>
          </div>
        </div>

        {/* Right Event Sidebar List */}
        <div className="space-y-4">
          <div className="bg-white border-3 border-black p-5 neo-shadow space-y-3">
            <h3 className="font-display font-black text-xl text-black uppercase border-b-3 border-black pb-3">
              Event Directory ({filteredEvents.length})
            </h3>
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredEvents.map((evt) => {
                const styleObj = getCategoryStyle(evt.category);
                const isSelected = selectedEvent?.id === evt.id;

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-3 border-3 border-black cursor-pointer transition-all neo-clickable ${
                      isSelected
                        ? 'bg-pastel-yellow shadow-[4px_4px_0px_0px_#000] -translate-y-1'
                        : 'bg-white hover:bg-[#F9F5F6] shadow-[2px_2px_0px_0px_#000]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span
                        className="px-2 py-0.5 text-[9px] font-black uppercase border border-black shadow-[1px_1px_0px_0px_#000]"
                        style={{ backgroundColor: styleObj.bg }}
                      >
                        {evt.category}
                      </span>
                      {evt.isAdminCustom && (
                        <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5">
                          ★ PINNED
                        </span>
                      )}
                    </div>
                    <h4 className="font-display font-black text-sm text-black uppercase leading-tight line-clamp-1">
                      {evt.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-black/70 mt-1.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {venues.find(v => v.id === evt.venueId)?.name || 'Campus Venue'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredEvents.length === 0 && (
                <div className="p-6 text-center bg-[#F9F5F6] border-2 border-black border-dashed">
                  <p className="font-bold text-xs uppercase text-black/60">No events found matching these filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default StudentEventMap;
