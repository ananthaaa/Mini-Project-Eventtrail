import React, { useContext, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../components/layout/PageShell';
import { RsvpContext } from '../context/RsvpContext';
import { NavModeContext } from '../context/NavModeContext';
import RSVPTicket from '../components/ui/RSVPTicket';
import { MapPin, ArrowLeft, Navigation, Ticket, RefreshCw, XCircle } from 'lucide-react';
import { VENUE_TO_NODE } from '../data/buildings';

const RsvpConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, userRsvps, cancelUserRsvp, isLoading } = useContext(RsvpContext);
  const { startNavigation } = useContext(NavModeContext);
  const [cancelling, setCancelling] = useState(false);

  const event = events.find((e) => e.id === id);
  const userRsvp = userRsvps ? userRsvps[id] : null;

  if (isLoading) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <div className="w-10 h-10 border-4 border-black border-t-accent-yellow rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-display font-black text-2xl uppercase tracking-wider text-black">
            Retrieving Reservation...
          </h3>
          <p className="text-xs font-bold text-black/60 uppercase mt-2">
            Loading confirmed ticket and queue credentials
          </p>
        </div>
      </PageShell>
    );
  }

  if (!event || !userRsvp) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <Ticket className="w-12 h-12 text-black/40 mx-auto mb-4" />
          <h3 className="font-display font-black text-2xl uppercase text-black mb-2">No Active Booking Found</h3>
          <p className="text-black/70 font-bold text-sm mb-6">
            You don't currently have an active reservation for this event.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/student/events/${id}`}
              className="inline-flex items-center justify-center gap-2 bg-pastel-yellow border-3 border-black px-6 py-3 font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
            >
              <ArrowLeft size={16} strokeWidth={3} />
              View Event Details
            </Link>
            <Link
              to="/student/events"
              className="inline-flex items-center justify-center gap-2 bg-white border-3 border-black px-6 py-3 font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
            >
              Browse Catalog
            </Link>
          </div>
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
    if (window.confirm("Are you sure you want to cancel your reservation? This cannot be undone.")) {
      setCancelling(true);
      try {
        await cancelUserRsvp(event.id);
        navigate(`/student/events/${event.id}`);
      } catch (err) {
        alert("Failed to cancel reservation: " + (err.message || 'Please try again.'));
      } finally {
        setCancelling(false);
      }
    }
  };

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={`/student/events/${event.id}`}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-white border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-yellow transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={3} />
          Back to Event Details
        </Link>
        <Link
          to="/student/tickets"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black bg-pastel-mint border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] hover:translate-y-px transition-all"
        >
          <Ticket size={14} strokeWidth={3} />
          All My Tickets
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-black mb-3"
          >
            {isWaitlisted ? "You're on the Waitlist" : "You're Confirmed!"}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-black/70 font-bold text-base max-w-lg mx-auto"
          >
            {isWaitlisted 
              ? "Your place in the waitlist queue is secured. If an attendee cancels, seats are offered in strict first-come order and you will be notified."
              : "Your seat is confirmed and your entry pass is generated below. Save or bookmark this page."}
          </motion.p>
        </div>

        <div className="mb-10">
          <RSVPTicket 
            event={event} 
            rsvpStatus={userRsvp.rsvpStatus} 
            ticketNumber={userRsvp.ticketNumber}
            checkInCode={userRsvp.checkInCode}
            waitlistPosition={userRsvp.waitlistPosition}
          />
        </div>

        {/* Action Controls */}
        <div className="bg-white border-3 border-black p-6 neo-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="font-display font-black text-sm uppercase text-black block mb-0.5">
              Campus Venue Directions
            </span>
            <span className="text-xs font-bold text-black/60">
              {event.location || 'ASIET Campus Venue'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleLaunchNavigation}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-pastel-yellow border-3 border-black px-6 py-3 font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
            >
              <Navigation size={16} strokeWidth={3} />
              Open Campus Map
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center justify-center gap-1.5 bg-red-50 border-3 border-black text-red-600 px-4 py-3 font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_#000] hover:bg-red-500 hover:text-white transition-all"
            >
              <XCircle size={15} />
              {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default RsvpConfirmation;
