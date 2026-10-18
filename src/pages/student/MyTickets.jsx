import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { RsvpContext } from '../../context/RsvpContext';
import { RoleContext } from '../../context/RoleContext';
import { Ticket, Calendar, MapPin, ArrowRight, Navigation, QrCode, XCircle } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import RSVPTicket from '../../components/ui/RSVPTicket';

export default function MyTickets() {
  const { events, userRsvps, cancelUserRsvp, isLoading } = useContext(RsvpContext);
  const { isLoggedIn } = useContext(RoleContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('confirmed'); // 'confirmed' | 'waitlisted' | 'all'
  const [selectedTicketEventId, setSelectedTicketEventId] = useState(null);

  if (!isLoggedIn) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <Ticket className="w-12 h-12 text-black/40 mx-auto mb-4" />
          <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-2">
            Sign In Required
          </h2>
          <p className="font-bold text-sm text-black/70 mb-6">
            Sign in with your campus account to view your confirmed tickets and waitlist reservations.
          </p>
          <Link
            to="/login"
            state={{ from: '/student/tickets' }}
            className="inline-block w-full py-3 bg-pastel-yellow border-3 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
          >
            Sign In to View Tickets
          </Link>
        </div>
      </PageShell>
    );
  }

  const bookedEventIds = Object.keys(userRsvps || {});
  const bookedEvents = (events || []).filter(e => bookedEventIds.includes(e.id));

  const confirmedList = bookedEvents.filter(e => userRsvps[e.id]?.rsvpStatus === "RSVP'd" || userRsvps[e.id]?.status === 'confirmed');
  const waitlistedList = bookedEvents.filter(e => userRsvps[e.id]?.rsvpStatus === 'Waitlisted' || userRsvps[e.id]?.status === 'waitlisted');

  const displayedList = activeTab === 'confirmed' 
    ? confirmedList 
    : (activeTab === 'waitlisted' ? waitlistedList : bookedEvents);

  const selectedEvent = selectedTicketEventId ? events.find(e => e.id === selectedTicketEventId) : null;
  const selectedRsvp = selectedTicketEventId ? userRsvps[selectedTicketEventId] : null;

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-8 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="mint" className="mb-3">Student Pass</Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-black">
            My Tickets
          </h1>
        </div>
        <p className="text-black/70 font-bold text-sm max-w-sm md:text-right">
          Access your confirmed admission passes, queue statuses, and venue directions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-3 border-black bg-white p-1 mb-8 self-start max-w-md shadow-[3px_3px_0px_0px_#000]">
        {[
          { id: 'confirmed', label: `Confirmed (${confirmedList.length})` },
          { id: 'waitlisted', label: `Waitlisted (${waitlistedList.length})` },
          { id: 'all', label: `All (${bookedEvents.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSelectedTicketEventId(null); }}
            className={`flex-1 py-2 px-3 font-display font-black text-xs uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-pastel-yellow border-2 border-black shadow-[1px_1px_0px_0px_#000]'
                : 'text-black/60 hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modal / Expanded Ticket View */}
      {selectedEvent && selectedRsvp && (
        <div className="mb-10 bg-pastel-yellow/20 border-4 border-black p-6 neo-shadow">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
            <span className="font-display font-black text-xs uppercase tracking-wider">
              Expanded Admission Pass
            </span>
            <button
              onClick={() => setSelectedTicketEventId(null)}
              className="px-2 py-1 bg-white border border-black font-black uppercase text-xs hover:bg-black hover:text-white"
            >
              Close Pass ✕
            </button>
          </div>
          <RSVPTicket
            event={selectedEvent}
            rsvpStatus={selectedRsvp.rsvpStatus}
            ticketNumber={selectedRsvp.ticketNumber}
            checkInCode={selectedRsvp.checkInCode}
            waitlistPosition={selectedRsvp.waitlistPosition}
          />
        </div>
      )}

      {/* Tickets List */}
      {isLoading ? (
        <div className="text-center py-16 bg-white border-3 border-black p-8 neo-shadow max-w-md mx-auto">
          <div className="w-8 h-8 border-4 border-black border-t-pastel-mint rounded-full animate-spin mx-auto mb-3" />
          <span className="font-display font-black text-sm uppercase">Loading your tickets...</span>
        </div>
      ) : displayedList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedList.map((evt) => {
            const rsvp = userRsvps[evt.id];
            const isWait = rsvp?.rsvpStatus === 'Waitlisted';

            return (
              <div
                key={evt.id}
                className="bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant={isWait ? 'peach' : 'mint'} className="border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                      {isWait ? 'Waitlist Queue' : 'Confirmed Seat'}
                    </Badge>
                    <span className="font-mono text-xs font-black bg-pastel-yellow px-2 py-0.5 border border-black">
                      {rsvp?.ticketNumber || 'TKT-PENDING'}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-2xl uppercase leading-tight text-black mb-2">
                    {evt.title}
                  </h3>

                  <div className="space-y-1 text-xs font-bold text-black/70 mb-4">
                    <p className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-black" />
                      {evt.date} • {evt.time}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-black" />
                      {evt.location || 'ASIET Campus'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-black/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedTicketEventId(selectedTicketEventId === evt.id ? null : evt.id)}
                    className="flex-1 py-2 px-3 bg-pastel-mint border-2 border-black font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-y-px transition-all flex items-center justify-center gap-1.5"
                  >
                    <QrCode size={14} />
                    {selectedTicketEventId === evt.id ? 'Hide Pass' : 'Show Pass & QR'}
                  </button>

                  <Link
                    to={`/student/events/${evt.id}`}
                    className="py-2 px-3 bg-white border-2 border-black font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-yellow transition-all flex items-center justify-center gap-1"
                  >
                    Event Details
                    <ArrowRight size={13} />
                  </Link>

                  <Link
                    to={`/student/campus-map?dest=${evt.venueId || 'campus-main'}`}
                    className="py-2 px-3 bg-white border-2 border-black font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_#000] hover:bg-pastel-peach transition-all flex items-center justify-center gap-1"
                  >
                    <Navigation size={13} />
                    Map
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-3 border-black p-12 text-center neo-shadow max-w-lg mx-auto">
          <Ticket className="w-12 h-12 text-black/30 mx-auto mb-4" />
          <h3 className="font-display font-black text-2xl uppercase mb-2">
            {activeTab === 'waitlisted' ? 'No Waitlist Registrations' : 'No Tickets Yet'}
          </h3>
          <p className="text-sm font-semibold text-black/60 mb-6">
            Explore upcoming technical conferences, workshops, and student festivals across campus.
          </p>
          <Link
            to="/student/events"
            className="inline-block py-3 px-6 bg-pastel-yellow border-3 border-black font-display font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
          >
            Browse Campus Events
          </Link>
        </div>
      )}
    </PageShell>
  );
}
