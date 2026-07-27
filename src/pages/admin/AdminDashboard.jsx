import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { RsvpContext } from '../../context/RsvpContext';
import { Calendar, Users, Eye, Plus, ArrowUpRight, Navigation, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const { events, deleteEvent, clearAllLocalData } = useContext(RsvpContext);
  const navigate = useNavigate();

  // Compute metrics
  const totalEvents = events.length;
  const totalRsvps = events.reduce((acc, curr) => acc + curr.rsvpCount, 0);
  const totalWaitlisted = events.reduce((acc, curr) => acc + curr.waitlistCount, 0);

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-10 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <Badge variant="peach" className="mb-3">Admin Portal</Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Admin Dashboard
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearAllLocalData}
            className="text-xs font-black uppercase tracking-wider text-red-500 hover:bg-red-50 border-2 border-red-200 py-2 px-4 transition-all active:translate-y-[1px]"
          >
            Reset Database
          </button>
          <Button
            onClick={() => navigate('/admin/event-form')}
            variant="primary"
            className="py-2.5 px-5"
          >
            <Plus size={16} />
            Create Event
          </Button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 select-none">
        <Card variant="white" shadowSize="medium" className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50 block mb-1">
            Total Live Events
          </span>
          <div className="flex justify-between items-end">
            <span className="font-display font-black text-4xl">{totalEvents}</span>
            <Badge variant="mint">Active</Badge>
          </div>
        </Card>
        
        <Card variant="white" shadowSize="medium" className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50 block mb-1">
            Total Registered RSVPs
          </span>
          <div className="flex justify-between items-end">
            <span className="font-display font-black text-4xl">{totalRsvps}</span>
            <span className="text-xs font-bold text-black/60 uppercase">Seats Claimed</span>
          </div>
        </Card>

        <Card variant="yellow" shadowSize="medium" className="p-6">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50 block mb-1">
            Waitlist Queue Count
          </span>
          <div className="flex justify-between items-end">
            <span className="font-display font-black text-4xl">{totalWaitlisted}</span>
            <Badge variant="dark">Awaiting Seat</Badge>
          </div>
        </Card>
      </div>

      {/* Events Admin Management List */}
      <div className="space-y-6 select-none">
        <h2 className="font-display font-black text-2xl uppercase text-left">
          Manage Event Sessions
        </h2>

        <div className="border-3 border-black bg-white neo-shadow overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6 border-b border-black">Event Session</th>
                <th className="py-4 px-6 border-b border-black">Faculty</th>
                <th className="py-4 px-6 border-b border-black text-center">Seats Config</th>
                <th className="py-4 px-6 border-b border-black text-center">RSVP</th>
                <th className="py-4 px-6 border-b border-black text-center">Waitlist</th>
                <th className="py-4 px-6 border-b border-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-display font-bold text-xs uppercase tracking-wider text-black/80">
              {events.map((evt) => (
                <tr key={evt.id} className="border-b-2 border-black/10 hover:bg-black/5 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-4">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-12 h-12 object-cover border-2 border-black shrink-0"
                    />
                    <div>
                      <span className="font-black text-sm text-black block leading-tight">{evt.title}</span>
                      <span className="text-xxs text-black/50 block mt-1">{evt.date} • {evt.time}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={evt.category === 'Tech' ? 'mint' : 'white'}>
                      {evt.faculty}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-center font-mono">{evt.seatsTotal}</td>
                  <td className="py-4 px-6 text-center font-mono text-green-600 font-black">{evt.rsvpCount}</td>
                  <td className="py-4 px-6 text-center font-mono text-red-500 font-black">{evt.waitlistCount}</td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/student/events/${evt.id}`)}
                      className="p-2 border-2 border-black hover:bg-pastel-mint transition-all neo-shadow-sm active:translate-y-[1px] active:neo-shadow-sm inline-flex items-center gap-1"
                      title="View Public Screen"
                    >
                      <Eye size={12} />
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/admin/event/${evt.id}/roster`)}
                      className="p-2 border-2 border-black bg-pastel-blue hover:bg-accent-blue hover:text-white transition-all neo-shadow-sm active:translate-y-[1px] active:neo-shadow-sm inline-flex items-center gap-1"
                      title="Manage Roster"
                    >
                      <Users size={12} />
                      Roster
                    </button>
                    <button
                      onClick={() => navigate(`/admin/venue-upload?eventId=${evt.id}`)}
                      className="p-2 border-2 border-black bg-pastel-yellow hover:bg-accent-yellow transition-all neo-shadow-sm active:translate-y-[1px] active:neo-shadow-sm inline-flex items-center gap-1"
                      title="Configure Waypoints"
                    >
                      <Navigation size={12} />
                      Waypoints
                    </button>
                    <button
                      onClick={() => {
                        if(window.confirm('Are you sure you want to delete this event?')) {
                          deleteEvent(evt.id);
                        }
                      }}
                      className="p-2 border-2 border-black bg-red-100 hover:bg-red-500 hover:text-white transition-all neo-shadow-sm active:translate-y-[1px] active:neo-shadow-sm inline-flex items-center gap-1"
                      title="Delete Event"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
};

export default AdminDashboard;
