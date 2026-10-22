import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CampusMap, { Marker, Popup } from '../../components/ui/CampusMap';
import RouteLayer from '../../components/ui/RouteLayer';
import CampusBuildingMarkers from '../../components/ui/CampusBuildingMarkers';
import { RoleContext } from '../../context/RoleContext';
import { RsvpContext } from '../../context/RsvpContext';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import {
  Sparkles, Calendar, MapPin, ArrowRight, Ticket, Users,
  Star, TrendingUp, BookOpen
} from 'lucide-react';

const StudentDashboard = () => {
  const { currentUser } = useContext(RoleContext);
  const { events, venues, userRsvps } = useContext(RsvpContext);
  const navigate = useNavigate();
  const [selectedMapEvent, setSelectedMapEvent] = useState(null);

  const firstName = currentUser?.name?.split(' ')[0] || 'Student';
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Events visible to students must be published
  const publishedEvents = (events || []).filter(e => e.status === 'published' || !e.status);

  // Events the user has RSVP'd for
  const rsvpEventIds = Object.keys(userRsvps || {});
  const userBookedEvents = publishedEvents.filter(e => rsvpEventIds.includes(e.id));
  
  // Find the next upcoming booked event
  const todayStr = new Date().toISOString().split('T')[0];
  const nextBookedEvent = userBookedEvents
    .filter(e => (e.startDate || e.date) >= todayStr)
    .sort((a, b) => (a.startDate || a.date).localeCompare(b.startDate || b.date))[0] || userBookedEvents[0];
  
  const nextVenue = nextBookedEvent ? (venues || []).find(v => v.id === nextBookedEvent.venueId) : null;
  const nextBooking = nextBookedEvent ? userRsvps[nextBookedEvent.id] : null;

  const upcomingRsvps = userBookedEvents.slice(0, 4);

  // Recommended: events not yet RSVP'd, with available seats
  const recommended = publishedEvents
    .filter(e => !rsvpEventIds.includes(e.id))
    .slice(0, 4);

  const quickStats = [
    { label: 'My RSVPs', value: rsvpEventIds.length, icon: Ticket, bg: 'mint' },
    { label: 'Events Live', value: publishedEvents.filter(e => e.seatsAvailable > 0).length, icon: TrendingUp, bg: 'peach' },
    { label: 'Active Clubs', value: '50+', icon: Users, bg: 'yellow' },
    { label: 'This Week', value: publishedEvents.slice(0, 3).length, icon: Calendar, bg: 'white' },
  ];

  return (
    <PageShell useGridPattern={false}>
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Welcome Banner */}
        <div className="bg-accent-yellow border-3 border-black p-8 md:p-12 neo-shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
              <Sparkles size={14} strokeWidth={3} className="text-black" />
              <span className="font-display font-black text-xs uppercase tracking-wider text-black">{greeting}</span>
            </div>
            <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-black mb-2 leading-none">
              Welcome back, <br className="hidden md:block" /> {firstName}!
            </h1>
            <p className="font-bold text-black/70 flex items-center gap-2 mt-4 uppercase text-sm tracking-wide">
              <Calendar size={16} strokeWidth={2.5} />
              {dateStr}
            </p>
          </div>
          
          {currentUser?.avatar && (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-3 border-black shadow-[4px_4px_0px_0px_#000] bg-white object-cover shrink-0"
            />
          )}
        </div>

        {/* Next Booked Event Spotlight (Prompt Item 7) */}
        {nextBookedEvent && (
          <div className="bg-white border-4 border-black p-6 md:p-8 neo-shadow-lg rounded-xl relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-3 border-black mb-6">
              <div className="flex items-center gap-3">
                <span className="inline-block p-2 bg-[#A3FFD6] border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000]">
                  <Ticket className="w-5 h-5 text-black" />
                </span>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Your Next Campus Activity</h3>
                  <p className="font-black text-lg text-black uppercase">Next Booked Event</p>
                </div>
              </div>
              <Badge variant={nextBooking?.status === 'waitlisted' ? 'yellow' : 'mint'}>
                {nextBooking?.status === 'waitlisted' ? 'On Waitlist' : 'Confirmed Pass'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-1">
                <img
                  src={nextBookedEvent.coverImage}
                  alt={nextBookedEvent.title}
                  className="w-full h-44 object-cover border-3 border-black shadow-[4px_4px_0px_0px_#000] rounded-lg"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-[#FFF066] border border-black rounded shadow-[1px_1px_0px_0px_#000]">
                    {nextBookedEvent.category || 'Campus Event'}
                  </span>
                  <h2 className="font-black text-2xl uppercase tracking-tight text-black mt-2">
                    {nextBookedEvent.title}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 font-bold text-gray-800">
                    <Calendar className="w-4 h-4 text-black shrink-0" />
                    <span>{nextBookedEvent.date} {nextBookedEvent.time ? `• ${nextBookedEvent.time}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-gray-800">
                    <MapPin className="w-4 h-4 text-black shrink-0" />
                    <span>{nextVenue?.name || nextBookedEvent.location || 'Campus Venue'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate('/student/tickets')}
                    className="px-4 py-2.5 bg-[#A3FFD6] border-2 border-black font-black uppercase text-xs rounded-lg shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    View Ticket / Pass
                  </button>
                  <button
                    onClick={() => navigate(`/student/navigate?eventId=${nextBookedEvent.id}&venueId=${nextBookedEvent.venueId}`)}
                    className="px-4 py-2.5 bg-[#FFEB3B] border-2 border-black font-black uppercase text-xs rounded-lg shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" />
                    Campus Directions
                  </button>
                  <button
                    onClick={() => navigate(`/student/events/${nextBookedEvent.id}`)}
                    className="px-4 py-2.5 bg-white border-2 border-black font-black uppercase text-xs rounded-lg shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                  >
                    Event Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {quickStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} variant={stat.bg} shadowSize="medium" className="p-4 md:p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center shrink-0">
                  <Icon size={20} strokeWidth={2.5} className="text-black" />
                </div>
                <div>
                  <div className="font-display font-black text-2xl md:text-3xl text-black leading-none mb-1">{stat.value}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-black/60">{stat.label}</div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Campus Map with Events */}
        <div className="bg-white border-3 border-black neo-shadow flex flex-col mb-10 overflow-hidden">
          <div className="p-6 border-b-3 border-black flex flex-wrap items-center justify-between gap-4 bg-pastel-yellow">
            <div className="flex items-center gap-3">
              <MapPin size={24} strokeWidth={2.5} className="text-black" />
              <div>
                <h2 className="font-display font-black text-xl uppercase tracking-tight m-0">Live Campus Map</h2>
                <p className="text-xs font-bold text-black/70 uppercase">3D Extrusion • Building Names • A* Road Network Routing</p>
              </div>
            </div>
            <Link
              to="/student/campus-map"
              className="px-3 py-1.5 bg-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-mint hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-1.5"
            >
              Open Route Finder →
            </Link>
          </div>
          <div className="h-[520px] w-full relative z-0">
            <CampusMap center={[76.4302, 10.1780]} zoom={17.8} initialPitch={55} initialBearing={-25}>
              {/* Verified Walking Path Route from Gate to CS Block */}
              <RouteLayer
                path={[
                  'gate-main',
                  '13998069845',
                  '13998069856',
                  '13998065967',
                  '13998056174',
                  '13998056173',
                  '14008132989',
                  '13998078223',
                  '13998078224',
                  'entrance-cs-block'
                ]}
                showBridgePoints={false}
              />

              {/* Standard Campus Building Name Labels */}
              <CampusBuildingMarkers
                onBuildingClick={(nodeId) => {
                  navigate(`/student/campus-map?dest=${nodeId}`);
                }}
              />

              {/* Green START Marker at Main Gate */}
              <Marker longitude={76.4291012} latitude={10.177813} anchor="bottom">
                <div className="flex flex-col items-center">
                  <div className="bg-[#00B67A] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                    START
                  </div>
                  <div className="w-5 h-5 bg-[#00B67A] border-3 border-black rounded-full shadow-[2px_2px_0px_0px_#000] animate-bounce" />
                </div>
              </Marker>

              {/* Orange DEST Marker at CS Block */}
              <Marker longitude={76.43053197142856} latitude={10.178252304761903} anchor="bottom">
                <div className="flex flex-col items-center">
                  <div className="bg-[#FF5A1F] text-white text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                    DEST
                  </div>
                  <div className="w-5 h-5 bg-[#FF5A1F] border-3 border-black rounded-none shadow-[2px_2px_0px_0px_#000]" />
                </div>
              </Marker>

              {/* Interactive Live Event Pins */}
              {publishedEvents.filter(e => e.seatsAvailable > 0 || rsvpEventIds.includes(e.id)).map(evt => {
                const venue = (venues || []).find(v => v.id === evt.venueId) || {};
                const lat = Number(evt.locationDetails?.entranceLat || evt.lat || (venue.outdoorCoordinates ? venue.outdoorCoordinates[0] : venue.lat));
                const lng = Number(evt.locationDetails?.entranceLng || evt.lng || (venue.outdoorCoordinates ? venue.outdoorCoordinates[1] : venue.lng));

                if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

                return (
                  <Marker 
                    key={evt.id} 
                    longitude={lng} 
                    latitude={lat} 
                    anchor="bottom"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setSelectedMapEvent({ evt, venue, lat, lng });
                    }}
                  >
                    <div className="w-8 h-8 bg-accent-yellow border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:scale-110 transition-transform font-black text-xs text-black ring-2 ring-black" title={evt.title}>
                      ★
                    </div>
                  </Marker>
                );
              })}

              {selectedMapEvent && (
                <Popup
                  longitude={selectedMapEvent.lng}
                  latitude={selectedMapEvent.lat}
                  anchor="top"
                  offset={15}
                  onClose={() => setSelectedMapEvent(null)}
                  className="neo-mapbox-popup !max-w-[260px]"
                  closeOnClick={false}
                >
                  <div className="p-1 w-[220px]">
                    {selectedMapEvent.evt.coverImage && (
                      <img src={selectedMapEvent.evt.coverImage} alt={selectedMapEvent.evt.title} className="w-full h-24 object-cover border-2 border-black mb-2" />
                    )}
                    <h4 className="font-display font-black uppercase text-sm mb-1 text-black">{selectedMapEvent.evt.title}</h4>
                    <p className="text-xs font-bold text-black/70 uppercase mb-2">
                      {selectedMapEvent.evt.time || 'All Day'} • {selectedMapEvent.evt.location || selectedMapEvent.venue?.name || 'Campus Venue'}
                    </p>
                    
                    <div className="flex justify-between items-center mt-2 border-t-2 border-black border-dashed pt-2">
                      <span className="text-xs font-bold uppercase text-black">
                        {selectedMapEvent.evt.seatsAvailable > 0 ? `${selectedMapEvent.evt.seatsAvailable} seats left` : 'Waitlist'}
                      </span>
                      <button 
                        onClick={() => navigate(`/student/events/${selectedMapEvent.evt.id}`)}
                        className="bg-pastel-mint border-2 border-black text-black text-xs font-black uppercase px-2 py-1 hover:bg-black hover:text-white transition-colors cursor-pointer neo-clickable"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </Popup>
              )}
            </CampusMap>
          </div>

          {/* Map Legend Bar matching FullCampusMap style */}
          <div className="bg-white border-t-3 border-black p-3.5 flex flex-wrap items-center justify-between gap-4 text-xs font-black uppercase tracking-wider">
            <div className="flex flex-wrap items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-[#00B67A] border-2 border-black inline-block"></span>
                <span>Start</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-[#FF5A1F] border-2 border-black inline-block"></span>
                <span>Destination</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-accent-yellow border-2 border-black rounded-full inline-block"></span>
                <span>Bridge Point</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-1.5 bg-[#FF5A1F] border border-black inline-block"></span>
                <span>A* Route</span>
              </span>
            </div>
            <span className="text-black/60 font-bold">Click any building tag for details</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          
          {/* Upcoming RSVPs */}
          <div className="bg-white border-3 border-black neo-shadow flex flex-col h-full">
            <div className="p-6 border-b-3 border-black flex items-center justify-between bg-pastel-mint">
              <div className="flex items-center gap-3">
                <Ticket size={24} strokeWidth={2.5} className="text-black" />
                <h2 className="font-display font-black text-xl uppercase tracking-tight m-0">My RSVPs</h2>
              </div>
              <Badge variant="white" className="shadow-[2px_2px_0px_0px_#000]">{rsvpEventIds.length} Total</Badge>
            </div>

            {upcomingRsvps.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center grow">
                <div className="w-16 h-16 bg-pastel-peach border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] mb-6 rotate-[-5deg]">
                  <Ticket size={32} strokeWidth={2} className="text-black" />
                </div>
                <p className="font-bold text-black/60 uppercase tracking-wide mb-6">No RSVPs yet. Grab your spot!</p>
                <button
                  onClick={() => navigate('/student/events')}
                  className="bg-black text-white font-display font-bold text-sm uppercase tracking-wide px-6 py-3 border-3 border-black hover:bg-transparent hover:text-black transition-colors"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-5 grow bg-white">
                {upcomingRsvps.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => navigate(`/student/events/${evt.id}`)}
                    className="flex items-center gap-4 p-3 border-3 border-black bg-white hover:bg-pastel-yellow transition-all cursor-pointer shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1"
                  >
                    <img src={evt.coverImage} alt={evt.title} className="w-20 h-20 object-cover border-3 border-black shadow-[2px_2px_0px_0px_#000] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-black text-lg uppercase truncate mb-1 text-black">{evt.title}</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-black/70 uppercase tracking-wider">
                        <span className="bg-pastel-mint px-2 py-0.5 border-2 border-black">{evt.date}</span>
                        <span className="truncate">{evt.faculty}</span>
                      </div>
                    </div>
                    <Badge variant="mint" className="hidden sm:inline-flex shrink-0 shadow-[2px_2px_0px_0px_#000]">RSVP'd</Badge>
                  </div>
                ))}
                {rsvpEventIds.length > 4 && (
                  <button
                    onClick={() => navigate('/student/events')}
                    className="w-full mt-2 py-4 border-3 border-black bg-white font-black text-sm uppercase tracking-wider hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_#000]"
                  >
                    View all {rsvpEventIds.length} RSVPs →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recommended Events */}
          <div className="bg-white border-3 border-black neo-shadow flex flex-col h-full">
            <div className="p-6 border-b-3 border-black flex items-center justify-between bg-pastel-peach">
              <div className="flex items-center gap-3">
                <Star size={24} strokeWidth={2.5} className="text-black" />
                <h2 className="font-display font-black text-xl uppercase tracking-tight m-0">Recommended</h2>
              </div>
              <button
                onClick={() => navigate('/student/events')}
                className="font-bold text-xs uppercase hover:underline flex items-center gap-1"
              >
                See all <ArrowRight size={12} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 grow bg-white">
              {recommended.length === 0 ? (
                <div className="p-8 text-center text-black font-black uppercase text-sm h-full flex items-center justify-center border-3 border-black border-dashed bg-pastel-mint">
                  You've RSVP'd for all available events! 🎉
                </div>
              ) : (
                recommended.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => navigate(`/student/events/${evt.id}`)}
                    className="flex items-center gap-4 p-3 border-3 border-black bg-white hover:bg-pastel-peach transition-all cursor-pointer shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1"
                  >
                    <img src={evt.coverImage} alt={evt.title} className="w-20 h-20 object-cover border-3 border-black shadow-[2px_2px_0px_0px_#000] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-black text-lg uppercase truncate mb-1 text-black">{evt.title}</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-black/70 uppercase tracking-wider">
                        <span className="bg-pastel-yellow px-2 py-0.5 border-2 border-black">{evt.date}</span>
                      </div>
                    </div>
                    {evt.seatsAvailable > 0 ? (
                      <Badge variant="yellow" className="shrink-0 shadow-[2px_2px_0px_0px_#000]">{evt.seatsAvailable} left</Badge>
                    ) : (
                      <Badge variant="dark" className="shrink-0 shadow-[2px_2px_0px_0px_#000]">Waitlist</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-3">
            <span className="w-8 h-8 bg-black flex items-center justify-center shadow-[2px_2px_0px_0px_#DAF5F0]">
              <ArrowRight size={16} className="text-white" strokeWidth={3} />
            </span>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Browse Events', icon: Calendar, to: '/student/events', bg: 'white' },
              { label: 'Explore Clubs', icon: Users, to: '/student/clubs', bg: 'mint' },
              { label: 'Campus Nav', icon: MapPin, to: '/student/navigate', bg: 'peach' },
              { label: 'My Profile', icon: BookOpen, to: '/student/profile', bg: 'yellow' },
            ].map(({ label, icon: Icon, to, bg }) => (
              <Card
                key={to}
                onClick={() => navigate(to)}
                variant={bg}
                shadowSize="small"
                className="p-5 flex items-center gap-4 cursor-pointer hover:neo-shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center shrink-0">
                  <Icon size={20} strokeWidth={2.5} className="text-black" />
                </div>
                <span className="font-display font-black text-sm uppercase">{label}</span>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default StudentDashboard;
