import React, { useContext, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RsvpContext } from '../../context/RsvpContext';
import PageShell from '../../components/layout/PageShell';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, UserCheck, Clock } from 'lucide-react';

const AdminRoster = () => {
  const { id } = useParams();
  const { events, userRsvps } = useContext(RsvpContext);

  const event = events.find(e => e.id === id);

  // Mocking roster data by generating fake users plus any local user RSVPs
  const rosterData = useMemo(() => {
    const list = [];
    
    // Add real local rsvp if it exists for this event
    if (userRsvps[id]) {
      list.push({
        name: 'Local Student',
        email: 'student@campus.edu',
        status: userRsvps[id].rsvpStatus === "RSVP'd" ? 'attending' : 'waitlisted',
        ticket: userRsvps[id].ticketNumber || 'N/A'
      });
    }

    // Generate fakes based on counts
    if (event) {
      for (let i = 0; i < event.rsvpCount - (userRsvps[id]?.rsvpStatus === "RSVP'd" ? 1 : 0); i++) {
        list.push({
          name: `Student ${i + 1}`,
          email: `student${i + 1}@campus.edu`,
          status: 'attending',
          ticket: `ET-${id.substring(0,4).toUpperCase()}-F${i}`
        });
      }
      for (let i = 0; i < event.waitlistCount - (userRsvps[id]?.rsvpStatus === 'Waitlisted' ? 1 : 0); i++) {
        list.push({
          name: `Waitlist ${i + 1}`,
          email: `waitlist${i + 1}@campus.edu`,
          status: 'waitlisted',
          ticket: 'N/A'
        });
      }
    }
    return list;
  }, [event, userRsvps, id]);

  if (!event) return <div className="p-10 text-center">Event not found</div>;

  const attendees = rosterData.filter(u => u.status === 'attending');
  const waitlisted = rosterData.filter(u => u.status === 'waitlisted');

  return (
    <PageShell>
      <div className="mb-6">
        <Link to="/admin" className="inline-flex items-center gap-2 font-bold hover:text-accent-red transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </Link>
      </div>

      <div className="mb-10 text-left border-b-3 border-black pb-6">
        <Badge variant="peach" className="mb-3">Roster Management</Badge>
        <h1 className="font-display font-black text-4xl uppercase tracking-tight">{event.title}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Attendees List */}
        <div>
          <h2 className="font-display font-black text-2xl uppercase border-b-4 border-black pb-2 mb-4 flex items-center justify-between">
            <span>Attending</span>
            <Badge variant="mint">{attendees.length} / {event.seatsTotal}</Badge>
          </h2>
          <div className="space-y-3">
            {attendees.length === 0 && <p className="text-gray-500 font-bold">No RSVPs yet.</p>}
            {attendees.map((user, idx) => (
              <div key={idx} className="border-3 border-black p-4 bg-white neo-shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-black text-lg">{user.name}</p>
                  <p className="text-sm font-bold text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="dark">{user.ticket}</Badge>
                  <UserCheck size={20} className="inline ml-3 text-green-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Waitlist List */}
        <div>
          <h2 className="font-display font-black text-2xl uppercase border-b-4 border-black pb-2 mb-4 flex items-center justify-between">
            <span>Waitlist</span>
            <Badge variant="yellow">{waitlisted.length}</Badge>
          </h2>
          <div className="space-y-3">
            {waitlisted.length === 0 && <p className="text-gray-500 font-bold">No one on the waitlist.</p>}
            {waitlisted.map((user, idx) => (
              <div key={idx} className="border-3 border-black p-4 bg-yellow-50 neo-shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-black text-lg">{user.name}</p>
                  <p className="text-sm font-bold text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <button className="px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-accent-red transition-colors">
                    Admit
                  </button>
                  <Clock size={20} className="inline ml-3 text-yellow-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default AdminRoster;
