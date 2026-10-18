import React, { useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import { RsvpContext } from '../context/RsvpContext';
import { NavModeContext } from '../context/NavModeContext';
import RSVPTicket from '../components/ui/RSVPTicket';
import { MapPin, ArrowLeft, Navigation } from 'lucide-react';
import { VENUE_TO_NODE } from '../data/buildings';

const RsvpConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, userRsvps, cancelUserRsvp, venues } = useContext(RsvpContext);
  const { startNavigation } = useContext(NavModeContext);

  const event = events.find((e) => e.id === id);
  const userRsvp = userRsvps[id];

  if (!event || !userRsvp) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20">
          <h3 className="font-display font-bold text-3xl text-text-primary mb-4">No RSVP Found</h3>
          <p className="text-text-secondary mb-8">
            You haven't RSVP'd to this event yet.
          </p>
          <Link to={`/event/${id}`} className="inline-flex items-center gap-2 bg-bg-surface border border-border-subtle px-6 py-3 rounded-full text-text-primary hover:text-accent transition-colors">
            <ArrowLeft size={16} />
            Go to Event Page
          </Link>
        </div>
      </PageShell>
    );
  }

  const isWaitlisted = userRsvp.rsvpStatus === 'Waitlisted';

  const handleLaunchNavigation = () => {
    startNavigation(event.id);
    navigate('/student/navigate');
  };

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel your RSVP?")) {
      try {
        await cancelUserRsvp(event.id);
        navigate(`/student/events/${event.id}`);
      } catch (err) {
        alert("Failed to cancel RSVP");
      }
    }
  };

  return (
    <PageShell>
      <div className="mb-6">
        <Link
          to={`/student/events/${event.id}`}
          className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-accent transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Event Details
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-bold text-4xl md:text-5xl text-text-primary mb-4"
          >
            {isWaitlisted ? "You're on the Waitlist" : "You're Going!"}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary text-lg"
          >
            {isWaitlisted 
              ? `You are position #${event.waitlistCount} in line. We'll let you know if a spot opens up.`
              : "Your seat is confirmed. Keep this ticket handy for entry."}
          </motion.p>
        </div>

        <div className="mb-12">
          <RSVPTicket 
            event={event} 
            rsvpStatus={userRsvp.rsvpStatus} 
            ticketNumber={userRsvp.ticketNumber} 
          />
        </div>

        {!isWaitlisted && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border-3 border-black neo-shadow-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-pastel-yellow border-2 border-black text-[10px] font-black uppercase px-2 py-0.5">
                  Campus Directions
                </span>
                <span className="bg-pastel-mint border-2 border-black text-[10px] font-black uppercase px-2 py-0.5">
                  Live Routing
                </span>
              </div>
              <h3 className="font-display font-black text-2xl text-black uppercase mb-1">Ready to head out?</h3>
              <p className="text-black/80 font-bold text-xs uppercase tracking-wide">
                Get road network walking directions across ASIET campus to {(venues || []).find(v => v.id === event.venueId)?.name || 'your venue'}, or follow indoor waypoints.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => navigate(`/student/campus-map?dest=${VENUE_TO_NODE[event.venueId] || 'entrance-cs-block'}`)}
                className="bg-accent-yellow border-3 border-black text-black font-black uppercase tracking-wider px-6 py-3 shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Navigation size={16} strokeWidth={3} />
                Campus Road Route
              </button>
              <button
                onClick={handleLaunchNavigation}
                className="bg-white border-3 border-black text-black font-black uppercase tracking-wider px-6 py-3 shadow-[3px_3px_0px_0px_#000] hover:bg-pastel-yellow hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_#000] active:translate-y-px transition-all flex items-center justify-center gap-2 text-xs"
              >
                <MapPin size={16} strokeWidth={3} />
                Indoor Guide
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={handleCancel}
            className="text-red-500 hover:text-red-700 underline font-medium transition-colors"
          >
            Cancel {isWaitlisted ? 'Waitlist' : 'RSVP'}
          </button>
        </div>
      </div>
    </PageShell>
  );
};

export default RsvpConfirmation;
