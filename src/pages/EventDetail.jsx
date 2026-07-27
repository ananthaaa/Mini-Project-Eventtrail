import React, { useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import { RsvpContext } from '../context/RsvpContext';
import { NotificationContext } from '../context/NotificationContext';
import mockSpeakers from '../data/speakers.json';
import mockClubs from '../data/clubs.json';
import SeatMeter from '../components/ui/SeatMeter';
import { Calendar, Clock, MapPin, ArrowLeft, Ticket, CheckCircle2, ChevronRight, Users } from 'lucide-react';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, userRsvps, submitRsvp } = useContext(RsvpContext);
  const { addNotification } = useContext(NotificationContext);

  const event = events.find((e) => e.id === id);

  if (!event) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20">
          <h3 className="font-display font-bold text-3xl text-text-primary mb-4">Event Not Found</h3>
          <p className="text-text-secondary mb-8">
            The event you are looking for does not exist or has been deleted.
          </p>
          <Link to="/discover" className="inline-flex items-center gap-2 bg-bg-surface border border-border-subtle px-6 py-3 rounded-full text-text-primary hover:text-accent transition-colors">
            <ArrowLeft size={16} />
            Back to Discover
          </Link>
        </div>
      </PageShell>
    );
  }

  const speakers = mockSpeakers.filter((spk) => event.speakerIds.includes(spk.id));
  const club = mockClubs.find((c) => c.id === event.organizerId);
  const userRsvp = userRsvps[event.id];

  const handleRsvpAction = () => {
    if (userRsvp) {
      navigate(`/student/rsvp-confirmation/${event.id}`);
    } else {
      const res = submitRsvp(event.id);
      if (res.rsvpStatus === "RSVP'd") {
        addNotification("Successfully registered for event!", "success");
      } else {
        addNotification("Added to waitlist.", "info");
      }
      navigate(`/student/rsvp-confirmation/${event.id}`);
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
              <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
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
                <div className="flex items-center gap-2"><MapPin size={18} strokeWidth={2.5} /><span>Room {event.venueId === 'science-hall-a' ? 'A' : '202'}</span></div>
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
                {event.schedule.map((item, idx) => (
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

          {club && (
            <div className="bg-pastel-peach border-3 border-black p-6 neo-shadow">
              <h3 className="text-black text-xs font-black uppercase tracking-widest mb-4 border-b-2 border-black pb-2">Hosted By</h3>
              <Link to={`/club/${club.id}`} className="flex items-center gap-4 group cursor-pointer active:translate-x-[1px] active:translate-y-[1px]">
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

          {speakers.length > 0 && (
            <div className="bg-pastel-yellow border-3 border-black p-6 neo-shadow">
              <h3 className="text-black text-xs font-black uppercase tracking-widest mb-4 border-b-2 border-black pb-2">Featured Speakers</h3>
              <div className="space-y-4">
                {speakers.map((spk) => (
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
