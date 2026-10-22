import React, { useContext, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RsvpContext } from '../../context/RsvpContext';
import { fetchEventRsvps, fetchEventById } from '../../services/apiService';
import PageShell from '../../components/layout/PageShell';
import Badge from '../../components/ui/Badge';
import { ArrowLeft, UserCheck, Clock, Loader2 } from 'lucide-react';

const AdminRoster = () => {
  const { id } = useParams();
  const { events } = useContext(RsvpContext);

  const [event, setEvent] = useState(() => events?.find(e => e.id === id) || null);
  const [rosterData, setRosterData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = events?.find(e => e.id === id);
    if (found) {
      setEvent(found);
    } else if (id) {
      fetchEventById(id)
        .then(evt => { if (evt) setEvent(evt); })
        .catch(err => console.error('Failed to load event details:', err));
    }
  }, [id, events]);

  useEffect(() => {
    const loadRoster = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchEventRsvps(id);
        // Map live DynamoDB RSVP records to match UI presentation
        const mapped = (Array.isArray(data) ? data : []).map(rsvp => ({
          name: rsvp.name || rsvp.userName || 'Campus Student',
          studentId: rsvp.studentId || (rsvp.userId ? `STU-${rsvp.userId.slice(-6).toUpperCase()}` : 'STU-VERIFIED'),
          email: rsvp.email || rsvp.userEmail || '—',
          status: (rsvp.status === 'confirmed' || rsvp.status === 'checked_in' || rsvp.checkedIn) ? 'attending' : (rsvp.status === 'waitlisted' ? 'waitlisted' : 'attending'),
          ticket: rsvp.ticketId || rsvp.ticket || (rsvp.userId ? `ET-${id.substring(0,4).toUpperCase()}-${rsvp.userId.substring(0,4).toUpperCase()}` : 'CONFIRMED'),
          checkInCode: rsvp.checkInCode || '',
          checkedIn: Boolean(rsvp.checkedIn || rsvp.status === 'checked_in'),
          createdAt: rsvp.createdAt || ''
        }));
        setRosterData(mapped);
      } catch (err) {
        console.error('Failed to load live roster data:', err);
        setRosterData([]);
      } finally {
        setLoading(false);
      }
    };
    loadRoster();
  }, [id]);

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
                  {user.checkInCode && (
                    <p className="text-xs font-mono font-bold text-black mt-1">
                      Check-in Code: <span className="bg-pastel-yellow px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000]">{user.checkInCode}</span>
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <Badge variant="dark">{user.ticket}</Badge>
                  {user.checkedIn ? (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-pastel-mint px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000]">
                      <UserCheck size={14} className="text-emerald-700" /> Checked In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-black/60 bg-neutral-100 px-2 py-0.5 border border-black/30">
                      Confirmed
                    </span>
                  )}
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
