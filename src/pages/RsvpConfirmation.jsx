import React, { useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import { RsvpContext } from '../context/RsvpContext';
import { NavModeContext } from '../context/NavModeContext';
import RSVPTicket from '../components/ui/RSVPTicket';
import { MapPin, ArrowLeft } from 'lucide-react';

const RsvpConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, userRsvps } = useContext(RsvpContext);
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
            className="bg-bg-surface border border-border-subtle rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div>
              <h3 className="font-display font-bold text-2xl text-text-primary mb-2">Ready to head out?</h3>
              <p className="text-text-secondary">Launch the indoor/outdoor navigator to find your way to Room {event.venueId === 'science-hall-a' ? 'A' : '202'}.</p>
            </div>
            <button
              onClick={handleLaunchNavigation}
              className="w-full md:w-auto bg-accent hover:bg-accent-hover text-accent-contrast font-medium px-8 py-4 rounded-full flex items-center justify-center gap-2 transition-colors shrink-0"
            >
              <MapPin size={18} />
              Launch Navigator
            </button>
          </motion.div>
        )}
      </div>
    </PageShell>
  );
};

export default RsvpConfirmation;
