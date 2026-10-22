import React, { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { RsvpContext } from '../../context/RsvpContext';
import { deleteEvent } from '../../services/apiService';
import { Calendar, Users, Eye, Plus, ArrowUpRight, Navigation, Trash2, Edit2, RefreshCw, Loader2, Ban, Clock, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { events, refreshEvents, removeEvent } = useContext(RsvpContext);
  const navigate = useNavigate();
  const [processingId, setProcessingId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Authoritative metrics computation — handles newly created records cleanly without NaN
  const totalEvents = events.length;
  const pendingEventsCount = events.filter(e => e.status === 'pending_approval' || e.status === 'pending_review').length;
  const totalRsvps = events.reduce((acc, curr) => {
    if (typeof curr.rsvpCount === 'number') return acc + curr.rsvpCount;
    if (typeof curr.seatsTotal === 'number' && typeof curr.seatsAvailable === 'number') {
      return acc + Math.max(0, curr.seatsTotal - curr.seatsAvailable);
    }
    return acc;
  }, 0);

  const totalWaitlisted = events.reduce((acc, curr) => {
    return acc + (typeof curr.waitlistCount === 'number' ? curr.waitlistCount : 0);
  }, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEvents();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancelOrDelete = async (evt, hard = false) => {
    const promptMsg = hard 
      ? `Permanently delete event "${evt.title}" from the database? This will remove all attendee records.`
      : `Cancel event "${evt.title}"? The event will be marked as cancelled and attendee records will be preserved.`;

    if (!window.confirm(promptMsg)) return;

    setProcessingId(evt.id);
    try {
      if (typeof removeEvent === 'function') {
        removeEvent(evt.id, hard);
      }
      await deleteEvent(evt.id, hard);
      await refreshEvents();
    } catch (err) {
      console.error('Failed to cancel/delete event:', err);
      alert('Operation failed: ' + (err.message || 'Please check admin permissions.'));
      await refreshEvents();
    } finally {
      setProcessingId(null);
    }
  };

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
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs font-black uppercase tracking-wider text-black bg-white hover:bg-pastel-yellow border-3 border-black py-2.5 px-4 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Live Data'}
          </button>
          <Button
            onClick={() => navigate('/admin/review-queue')}
            variant={pendingEventsCount > 0 ? "primary" : "secondary"}
            className="py-2.5 px-5 bg-pastel-yellow hover:bg-amber-300 border-2 border-black flex items-center gap-2"
          >
            <Clock size={16} />
            Approval Queue
            {pendingEventsCount > 0 && (
              <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_0px_#000]">
                {pendingEventsCount}
              </span>
            )}
          </Button>
          <Button
            onClick={() => navigate('/admin/clubs/new')}
            variant="secondary"
            className="py-2.5 px-5 bg-white border-2 border-black"
          >
            <Users size={16} />
            Create Club
          </Button>
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
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6 border-b border-black">Event Session</th>
                <th className="py-4 px-6 border-b border-black">Faculty</th>
                <th className="py-4 px-6 border-b border-black text-center">Status</th>
                <th className="py-4 px-6 border-b border-black text-center">Capacity</th>
                <th className="py-4 px-6 border-b border-black text-center">Booked</th>
                <th className="py-4 px-6 border-b border-black text-center">Waitlist</th>
                <th className="py-4 px-6 border-b border-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-display font-bold text-xs uppercase tracking-wider text-black/80">
              {events.map((evt) => {
                const bookedCount = evt.rsvpCount ?? (evt.seatsTotal ? Math.max(0, evt.seatsTotal - (evt.seatsAvailable ?? evt.seatsTotal)) : 0);
                const waitCount = evt.waitlistCount ?? 0;
                const isCancelled = evt.status === 'cancelled';

                return (
                  <tr key={evt.id} className={`border-b-2 border-black/10 hover:bg-black/5 transition-colors ${isCancelled ? 'opacity-60 bg-red-50/30' : ''}`}>
                    <td className="py-4 px-6 flex items-center gap-4">
                      <img
                        src={evt.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=200&auto=format&fit=crop'}
                        alt=""
                        className="w-12 h-12 object-cover border-2 border-black shrink-0"
                      />
                      <div>
                        <span className="font-black text-sm text-black block leading-tight">{evt.title}</span>
                        <span className="text-xxs text-black/50 block mt-1">{evt.date} • {evt.time}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={evt.category === 'Tech' ? 'mint' : 'white'}>
                        {evt.faculty || 'General'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2 py-0.5 border border-black text-[10px] font-black uppercase ${
                        isCancelled 
                          ? 'bg-red-200 text-red-800' 
                          : (evt.status === 'pending_approval' || evt.status === 'pending_review' 
                            ? 'bg-pastel-yellow text-black animate-pulse' 
                            : 'bg-pastel-mint text-black')
                      }`}>
                        {evt.status === 'pending_approval' ? 'Pending Review' : (evt.status || 'published')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-mono">{evt.seatsTotal}</td>
                    <td className="py-4 px-6 text-center font-mono text-green-700 font-black">{bookedCount}</td>
                    <td className="py-4 px-6 text-center font-mono text-amber-600 font-black">{waitCount}</td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      {(evt.status === 'pending_approval' || evt.status === 'pending_review') && (
                        <button
                          onClick={() => navigate('/admin/review-queue')}
                          className="p-2 border-2 border-black bg-pastel-yellow hover:bg-amber-300 font-black transition-all shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] inline-flex items-center gap-1"
                          title="Review Event"
                        >
                          <Clock size={12} />
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/event-form/${evt.id}`)}
                        className="p-2 border-2 border-black bg-pastel-mint hover:bg-emerald-300 transition-all shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] inline-flex items-center gap-1"
                        title="Edit Event Details"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      <button
                        onClick={() => navigate(`/admin/event/${evt.id}/roster`)}
                        className="p-2 border-2 border-black bg-white hover:bg-pastel-yellow transition-all shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] inline-flex items-center gap-1"
                        title="View Attendee Roster"
                      >
                        <Eye size={12} />
                        Roster
                      </button>
                      <button
                        onClick={() => navigate(`/admin/venue-upload?eventId=${evt.id}`)}
                        className="p-2 border-2 border-black bg-pastel-yellow hover:bg-amber-300 transition-all shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] inline-flex items-center gap-1"
                        title="Configure Venue & Navigation"
                      >
                        <Navigation size={12} />
                        Waypoints
                      </button>
                      {!isCancelled && (
                        <button
                          disabled={processingId === evt.id}
                          onClick={() => handleCancelOrDelete(evt, false)}
                          className="p-2 border-2 border-black bg-amber-100 hover:bg-amber-400 text-black transition-all shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] inline-flex items-center gap-1 disabled:opacity-50"
                          title="Cancel Event (preserves records)"
                        >
                          {processingId === evt.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                          Cancel
                        </button>
                      )}
                      <button
                        disabled={processingId === evt.id}
                        onClick={() => handleCancelOrDelete(evt, true)}
                        className="p-2 border-2 border-black bg-red-100 hover:bg-red-500 hover:text-white transition-all shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] inline-flex items-center gap-1 disabled:opacity-50"
                        title="Permanently Delete Event"
                      >
                        {processingId === evt.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
};

export default AdminDashboard;
