import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RsvpContext } from '../../context/RsvpContext';
import { fetchEventRsvps } from '../../services/apiService';
import PageShell from '../../components/layout/PageShell';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, UserCheck, Clock, Loader2 } from 'lucide-react';

const AdminRoster = () => {
  const { id } = useParams();
  const { events, userRsvps } = useContext(RsvpContext);

  const event = events.find(e => e.id === id);

  const [rosterData, setRosterData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoster = async () => {
      try {
        const data = await fetchEventRsvps(id);
        // Map the backend data to match the UI expectations
        const mapped = data.map(rsvp => ({
          name: rsvp.name || 'Unknown Student',
          studentId: rsvp.studentId || 'STU-UNKNOWN',
          email: rsvp.email || 'No email provided',
          status: rsvp.status === 'confirmed' ? 'attending' : 'waitlisted',
          ticket: rsvp.status === 'confirmed' ? `ET-${id.substring(0,4).toUpperCase()}-${rsvp.userId.substring(0,4).toUpperCase()}` : 'N/A'
        }));
        setRosterData(mapped);
      } catch (err) {
        console.error('Failed to load roster data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (event) {
      loadRoster();
    }
  }, [id, event]);

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h1 className="font-display font-black text-4xl uppercase tracking-tight">{event.title}</h1>
          <Link
            to={`/admin/event-form/${id}`}
            className="px-5 py-2.5 bg-pastel-yellow border-3 border-black font-bold uppercase tracking-wider hover:bg-accent-yellow transition-colors neo-shadow-sm active:translate-y-[1px] active:neo-shadow-none"
          >
            Edit Event
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-2 flex justify-center py-12">
            <Loader2 className="animate-spin text-black" size={32} />
          </div>
        ) : (
          <>
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
                  <p className="text-sm font-bold text-gray-500">{user.studentId} &bull; {user.email}</p>
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
                  <p className="text-sm font-bold text-gray-500">{user.studentId} &bull; {user.email}</p>
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
        </>
        )}
      </div>
    </PageShell>
  );
};

export default AdminRoster;
