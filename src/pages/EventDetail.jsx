import React, { useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import { RoleContext } from '../context/RoleContext';
import { RsvpContext } from '../context/RsvpContext';
import { NotificationContext } from '../context/NotificationContext';
import { fetchSpeakers, fetchClubs, fetchEventById, fetchEvents } from '../services/apiService';
import SeatMeter from '../components/ui/SeatMeter';
import {
  Calendar, Clock, MapPin, ArrowLeft, Ticket, CheckCircle2,
  ChevronRight, Users, Navigation, Compass, ExternalLink
} from 'lucide-react';
import { VENUE_TO_NODE, BUILDING_INFO } from '../data/buildings';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, user, isLoggedIn } = useContext(RoleContext);
  const activeUser = currentUser || user;
  const { userRsvps, submitRsvp, venues } = useContext(RsvpContext);
  const { addNotification } = useContext(NotificationContext);

  const [event, setEvent] = React.useState(null);
  const [speakers, setSpeakers] = React.useState([]);
  const [clubs, setClubs] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // 1. Load essential event details independently
      let apiEvent = null;
      try {
        apiEvent = await fetchEventById(id);
      } catch (err) {
        console.warn('Direct fetchEventById failed, trying events list fallback:', err.message);
        const allEvts = await fetchEvents({ status: 'all', admin: 'true' });
        apiEvent = allEvts.find(e => e.id === id);
        if (!apiEvent) throw err;
      }
      setEvent(apiEvent);

      // 2. Enrich with optional speaker and club info without failing the event
      Promise.allSettled([fetchSpeakers(), fetchClubs()])
        .then(([speakersRes, clubsRes]) => {
          if (speakersRes.status === 'fulfilled' && Array.isArray(speakersRes.value)) {
            setSpeakers(speakersRes.value);
          }
          if (clubsRes.status === 'fulfilled' && Array.isArray(clubsRes.value)) {
            setClubs(clubsRes.value);
          }
        })
        .catch(() => {});
    } catch (error) {
      console.error('Failed to load event details:', error);
      setFetchError(error);
      setEvent(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <div className="w-10 h-10 border-4 border-black border-t-accent-yellow rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-display font-black text-2xl uppercase tracking-wider text-black">
            Loading Event Details...
          </h3>
          <p className="text-xs font-bold text-black/60 uppercase mt-2">
            Fetching verified schedule and venue coordinates
          </p>
        </div>
      </PageShell>
    );
  }

  if (fetchError || !event) {
    const isNotFound = fetchError?.status === 404;
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <h3 className="font-display font-black text-3xl text-black mb-3 uppercase tracking-tight">
            {isNotFound ? "Event Not Found" : "Connection Error"}
          </h3>
          <p className="text-black/70 font-bold text-sm mb-6">
            {isNotFound
              ? "The event you are looking for does not exist or may have been unlisted."
              : "Unable to load event details. Please verify your internet connection and try again."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isNotFound && (
              <button
                onClick={loadData}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-pastel-yellow border-3 border-black px-6 py-3 font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
              >
                Retry
              </button>
            )}
            <Link
              to="/student/events"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border-3 border-black px-6 py-3 font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
            >
              <ArrowLeft size={16} strokeWidth={3} />
              Browse Events
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const eventSpeakers = speakers.filter((spk) => (event.speakerIds || []).includes(spk.id));
  const club = clubs.find((c) => c.id === event.organizerId);
  const userRsvp = (userRsvps || {})[event.id];

  const currentVenue = (venues || []).find((v) => v.id === event.venueId) || {
    id: event.venueId,
    name: event.location || 'Campus Auditorium',
    building: event.locationDetails?.building || 'Main Campus Complex',
    distance: 'Campus compound',
    timeEstimation: 'Walkable',
  };
  const targetNodeId = VENUE_TO_NODE[event.venueId] || 'entrance-cs-block';
  const targetBuilding = BUILDING_INFO[targetNodeId];

  const handleRsvpAction = async () => {
    if (userRsvp) {
      navigate(`/student/rsvp-confirmation/${event.id}`);
      return;
    }

    if (!isLoggedIn || !activeUser) {
      navigate('/login', { state: { from: `/student/events/${event.id}` } });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await submitRsvp(event.id);
      if (res.rsvpStatus === "RSVP'd") {
        addNotification("Registration confirmed! Your admission ticket is ready.", "success");
      } else {
        addNotification("Event is currently full. You have joined the waitlist queue.", "info");
      }
      navigate(`/student/rsvp-confirmation/${event.id}`);
    } catch (err) {
      addNotification(err.message || "Failed to complete reservation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-8">
        <Link
          to="/student/events"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border-3 border-black font-black uppercase tracking-wider text-xs hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <ArrowLeft size={16} strokeWidth={3} />
          Back to Events
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-3 border-black neo-shadow-lg relative overflow-hidden bg-white mb-10 flex flex-col"
          >
            <div className="aspect-[21/9] w-full border-b-3 border-black">
              <img 
                src={event.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop'} 
                alt={event.title || 'Event'} 
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="p-8 md:p-12 w-full bg-pastel-mint">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-pastel-yellow border-2 border-black text-black text-xs font-black uppercase tracking-wider">{event.category}</span>
                <span className="px-3 py-1 bg-white border-2 border-black text-black text-xs font-black uppercase tracking-wider">{event.faculty}</span>
              </div>
              <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-black tracking-tight leading-none mb-6">
                {event.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-black uppercase tracking-wider">
                <div className="flex items-center gap-2"><Calendar size={18} strokeWidth={2.5} /><span>{event.date}</span></div>
                <div className="flex items-center gap-2"><Clock size={18} strokeWidth={2.5} /><span>{event.time}</span></div>
                <button
                  type="button"
                  onClick={() => navigate(`/student/campus-map?dest=${targetNodeId}`)}
                  className="flex items-center gap-2 hover:underline cursor-pointer group text-left"
                  title="View walking route on Campus Map"
                >
                  <MapPin size={18} strokeWidth={2.5} className="group-hover:text-red-600 transition-colors shrink-0" />
                  <span>{currentVenue.name}</span>
                </button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border-3 border-black p-8 neo-shadow h-full">
              <h2 className="font-display font-black text-2xl text-black uppercase mb-6 flex items-center gap-3">
                About The Event
              </h2>
              <p className="text-black font-bold leading-relaxed text-sm uppercase tracking-wide">
                {event.description}
              </p>
            </div>
            
            <div className="bg-white border-3 border-black p-8 neo-shadow h-full">
              <h2 className="font-display font-black text-2xl text-black uppercase mb-6">Schedule Timeline</h2>
              <div className="space-y-6 border-l-4 border-black ml-3 pl-6 relative">
                {(event.schedule || []).map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[35px] top-1 w-4 h-4 bg-pastel-yellow border-3 border-black rounded-none" />
                    <span className="bg-black text-white px-2 py-0.5 text-xs font-black tracking-widest uppercase inline-block mb-2">{item.time}</span>
                    <h3 className="font-display font-black text-lg text-black uppercase leading-tight mb-1">{item.title}</h3>
                    <p className="text-black/80 font-bold text-xs uppercase tracking-wide">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: RSVP & Organizers */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border-3 border-black p-8 neo-shadow-lg space-y-8"
          >
            <SeatMeter total={event.seatsTotal} available={event.seatsAvailable} />
            
            <button
              onClick={handleRsvpAction}
              className={`w-full flex items-center justify-center gap-2 py-4 font-black uppercase tracking-wider text-sm border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all ${userRsvp ? 'bg-pastel-mint text-black' : event.seatsAvailable > 0 ? 'bg-black text-white hover:bg-white hover:text-black' : 'bg-gray-300 text-black'}`}
            >
              {userRsvp ? (
                <><CheckCircle2 size={18} strokeWidth={3} /> View Ticket Confirmation</>
              ) : event.seatsAvailable > 0 ? (
                <><Ticket size={18} strokeWidth={3} /> RSVP & Get Ticket</>
              ) : (
                <><Users size={18} strokeWidth={3} /> Join Waitlist</>
              )}
            </button>
          </motion.div>

          {/* Venue & Navigation Card */}
          <div className="bg-white border-3 border-black p-6 neo-shadow space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-black" strokeWidth={3} />
                <h3 className="font-display font-black text-lg text-black uppercase">Venue Location</h3>
              </div>
              <span className="bg-pastel-yellow border-2 border-black text-[10px] font-black uppercase px-2 py-0.5">
                Campus Map
              </span>
            </div>

            <div>
              <h4 className="font-display font-black text-xl text-black uppercase leading-tight">
                {currentVenue.name}
              </h4>
              <p className="text-xs font-bold text-black/70 uppercase mt-1">
                {currentVenue.building || targetBuilding?.label}
              </p>
              {targetBuilding?.description && (
                <p className="text-xs font-bold text-black/80 mt-2 line-clamp-2">
                  {targetBuilding.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-pastel-mint border-2 border-black p-2 text-center">
                <span className="text-[10px] font-black uppercase text-black/60 block">Distance</span>
                <span className="text-xs font-black text-black">{currentVenue.distance || '450m'}</span>
              </div>
              <div className="bg-pastel-peach border-2 border-black p-2 text-center">
                <span className="text-[10px] font-black uppercase text-black/60 block">Walk Time</span>
                <span className="text-xs font-black text-black">{currentVenue.timeEstimation || '6 mins'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => navigate(`/student/campus-map?dest=${targetNodeId}`)}
                className="w-full bg-accent-yellow border-3 border-black text-black font-black uppercase tracking-wider py-3 shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Navigation className="w-4 h-4" strokeWidth={3} />
                Navigate on Campus Map
              </button>

              <button
                onClick={() => navigate('/student/navigate')}
                className="w-full bg-white border-2 border-black text-black font-black uppercase tracking-wider py-2 shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-yellow transition-all flex items-center justify-center gap-2 text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={3} />
                Indoor Step-by-Step Guide
              </button>
            </div>
          </div>

          {club && (
            <div className="bg-pastel-peach border-3 border-black p-6 neo-shadow">
              <h3 className="text-black text-xs font-black uppercase tracking-widest mb-4 border-b-2 border-black pb-2">Hosted By</h3>
              <Link to={`/student/clubs/${club.id}`} className="flex items-center gap-4 group cursor-pointer active:translate-x-[1px] active:translate-y-[1px]">
                <div className={`w-14 h-14 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center font-display font-black text-xl text-black`}>
                  {club.logo}
                </div>
                <div>
                  <h4 className="font-display font-black text-lg text-black uppercase group-hover:underline flex items-center gap-1">
                    {club.name} <ChevronRight size={16} strokeWidth={3} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-black/70 font-bold text-xs uppercase tracking-wide">View Organizer Profile</p>
                </div>
              </Link>
            </div>
          )}

          {eventSpeakers.length > 0 && (
            <div className="bg-pastel-yellow border-3 border-black p-6 neo-shadow">
              <h3 className="text-black text-xs font-black uppercase tracking-widest mb-4 border-b-2 border-black pb-2">Featured Speakers</h3>
              <div className="space-y-4">
                {eventSpeakers.map((spk) => (
                  <div key={spk.id} className="flex items-center gap-4 bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000]">
                    <div className="w-12 h-12 border-2 border-black flex items-center justify-center font-display font-black text-black bg-pastel-mint shadow-[2px_2px_0px_0px_#000]">
                      {spk.avatarText}
                    </div>
                    <div>
                      <h4 className="font-display font-black text-black uppercase">{spk.name}</h4>
                      <p className="text-black/70 font-bold text-xs uppercase tracking-wider">{spk.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default EventDetail;
