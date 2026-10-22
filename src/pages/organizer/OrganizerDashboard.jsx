import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { RoleContext } from '../../context/RoleContext';
import { fetchEvents, updateEvent, deleteEvent, fetchClubById } from '../../services/apiService';
import {
  Calendar,
  Users,
  Plus,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileEdit,
  Send,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, clubId } = useContext(RoleContext);

  const [events, setEvents] = useState([]);
  const [clubInfo, setClubInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'draft' | 'pending_approval' | 'needs_changes' | 'published' | 'rejected'
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsData, clubData] = await Promise.all([
        fetchEvents({ status: 'all' }),
        clubId ? fetchClubById(clubId).catch(() => null) : Promise.resolve(null)
      ]);

      if (Array.isArray(eventsData)) {
        const targetClubId = clubId || currentUser?.clubId;
        const targetEmail = currentUser?.email?.trim().toLowerCase();
        const targetUserId = currentUser?.id;
        const targetClubName = (clubData?.name || currentUser?.clubName || '')?.trim().toLowerCase();

        // Strictly match events created for/by this club only
        const clubEvents = eventsData.filter(evt => {
          if (!evt) return false;
          // 1. Direct Club ID match
          if (targetClubId) {
            if (evt.clubId && String(evt.clubId) === String(targetClubId)) return true;
            if (evt.organizerId && String(evt.organizerId) === String(targetClubId)) return true;
          }
          // 2. Organizer / User ID match
          if (targetUserId && evt.organizerId && String(evt.organizerId) === String(targetUserId)) {
            return true;
          }
          // 3. Organizer Email match
          if (targetEmail) {
            if (evt.organizerEmail && evt.organizerEmail.trim().toLowerCase() === targetEmail) return true;
            if (evt.organizerId && typeof evt.organizerId === 'string' && evt.organizerId.trim().toLowerCase() === targetEmail) return true;
          }
          // 4. Club Name match (case-insensitive)
          if (targetClubName && targetClubName.length > 0) {
            if (evt.clubName && typeof evt.clubName === 'string' && evt.clubName.trim().toLowerCase() === targetClubName) return true;
            if (evt.organizer && typeof evt.organizer === 'string' && evt.organizer.trim().toLowerCase() === targetClubName) return true;
          }
          return false;
        });

        // Strictly show only this club's events; if 0 events, show empty list (never leak other clubs' events)
        setEvents(clubEvents);
      } else {
        setEvents([]);
      }
      if (clubData) setClubInfo(clubData);
    } catch (err) {
      console.error('Failed to load organizer dashboard events:', err);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Counts by status
  const draftsCount = events.filter(e => e.status === 'draft').length;
  const pendingCount = events.filter(e => e.status === 'pending_approval').length;
  const needsChangesCount = events.filter(e => e.status === 'needs_changes').length;
  const publishedCount = events.filter(e => e.status === 'published').length;

  const filteredEvents = events.filter(evt => {
    if (activeTab === 'all') return true;
    return evt.status === activeTab;
  });

  const handleSubmitForApproval = async (evt) => {
    if (!window.confirm(`Submit "${evt.title}" to Campus Administration for review and publication?`)) return;
    setActionLoadingId(evt.id);
    try {
      await updateEvent(evt.id, {
        status: 'pending_approval'
      });
      await loadData();
    } catch (err) {
      alert('Failed to submit event: ' + (err.message || 'Check connection.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteDraft = async (evt) => {
    if (!window.confirm(`Delete draft "${evt.title}"? This cannot be undone.`)) return;
    setActionLoadingId(evt.id);
    try {
      await deleteEvent(evt.id, true);
      await loadData();
    } catch (err) {
      alert('Failed to delete draft: ' + (err.message || 'Check connection.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge variant="mint" className="border-black shadow-[1px_1px_0px_0px_#000]">Published & Live</Badge>;
      case 'pending_approval':
        return <Badge variant="yellow" className="border-black shadow-[1px_1px_0px_0px_#000]">Pending Review</Badge>;
      case 'needs_changes':
        return <Badge variant="peach" className="border-black shadow-[1px_1px_0px_0px_#000]">Needs Revisions</Badge>;
      case 'rejected':
        return <Badge variant="danger" className="border-black shadow-[1px_1px_0px_0px_#000]">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="danger" className="border-black shadow-[1px_1px_0px_0px_#000]">Cancelled</Badge>;
      case 'draft':
      default:
        return <Badge variant="white" className="border-black shadow-[1px_1px_0px_0px_#000]">Draft</Badge>;
    }
  };

  const handleEventCardClick = (evt) => {
    if (evt.status === 'published') {
      navigate(`/organizer/events/${evt.id}/roster`);
    } else {
      navigate(`/organizer/events/${evt.id}/edit`);
    }
  };

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-8 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <Badge variant="yellow" className="mb-3">
            {clubInfo?.name || currentUser?.clubName || 'Club Organizer Portal'}
          </Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Organizer Dashboard
          </h1>
          <p className="text-sm font-bold text-black/60 mt-2 uppercase tracking-wider">
            Plan club events, review feedback, and manage campus rosters
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="text-xs font-black uppercase tracking-wider text-black bg-white hover:bg-pastel-yellow border-3 border-black py-2.5 px-4 transition-all shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <Button
            onClick={() => navigate('/organizer/events/new')}
            variant="primary"
            className="py-2.5 px-5 bg-pastel-mint border-3 border-black shadow-[3px_3px_0px_0px_#000]"
          >
            <Plus size={16} />
            Create Event
          </Button>
        </div>
      </div>

      {/* Governance Explanation Alert */}
      <div className="mb-8 bg-white border-3 border-black p-4 neo-shadow flex items-start gap-3">
        <Info size={20} className="text-black shrink-0 mt-0.5" />
        <div className="text-xs font-bold text-black/80 space-y-1">
          <p className="font-black uppercase text-black">
            Campus Governance Workflow:
          </p>
          <p>
            Organizers create event drafts and submit them for review. Platform administrators verify venue availability and approve events. Only approved events appear in student discovery.
          </p>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 select-none">
        <Card variant="white" shadowSize="medium" className="p-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-black/50 block mb-1">
            Total Events
          </span>
          <span className="font-display font-black text-3xl text-black">
            {events.length}
          </span>
        </Card>

        <Card variant="yellow" shadowSize="medium" className="p-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-1">
            Pending Review
          </span>
          <span className="font-display font-black text-3xl text-black">
            {pendingCount}
          </span>
        </Card>

        <Card variant="peach" shadowSize="medium" className="p-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-1">
            Needs Revisions
          </span>
          <span className="font-display font-black text-3xl text-black">
            {needsChangesCount}
          </span>
        </Card>

        <Card variant="mint" shadowSize="medium" className="p-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block mb-1">
            Published & Live
          </span>
          <span className="font-display font-black text-3xl text-black">
            {publishedCount}
          </span>
        </Card>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b-3 border-black mb-6 overflow-x-auto gap-2 pb-2">
        {[
          { id: 'all', label: `All (${events.length})` },
          { id: 'draft', label: `Drafts (${draftsCount})` },
          { id: 'pending_approval', label: `Pending Review (${pendingCount})` },
          { id: 'needs_changes', label: `Needs Changes (${needsChangesCount})` },
          { id: 'published', label: `Published (${publishedCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-2 px-4 border-2 font-display font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_#FFDB58]'
                : 'bg-white text-black border-black/40 hover:border-black hover:bg-neutral-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="text-center py-20 font-display font-black text-2xl uppercase">
          Loading Club Events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="border-3 border-black bg-white p-12 text-center neo-shadow">
          <p className="font-display font-black text-xl uppercase text-black mb-2">
            No events found in this category
          </p>
          <p className="text-xs font-bold text-black/60 uppercase tracking-wider mb-6">
            Get started by creating your next campus gathering
          </p>
          <Button
            onClick={() => navigate('/organizer/events/new')}
            variant="primary"
            className="py-3 px-6"
          >
            <Plus size={16} />
            Create Event Draft
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white border-3 border-black neo-shadow flex flex-col justify-between overflow-hidden"
            >
              {/* Clickable Card Body (Routes inside Organizer Portal) */}
              <div
                onClick={() => handleEventCardClick(evt)}
                className="cursor-pointer group flex-1"
                title={evt.status === 'published' ? 'Manage Attendee Roster & Check-In' : 'Edit Event Details'}
              >
                {/* Event Image Banner */}
                <div className="h-44 border-b-3 border-black relative overflow-hidden bg-neutral-100">
                  <img
                    src={evt.coverImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop"}
                    alt={evt.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    {getStatusBadge(evt.status)}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 bg-black text-white px-2 py-0.5 border border-black text-[10px] font-black uppercase tracking-wider">
                    {evt.category || 'Event'}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-display font-black text-lg uppercase tracking-tight text-black line-clamp-2 mb-3 group-hover:underline">
                    {evt.title}
                  </h3>

                  <div className="space-y-1.5 text-xs font-bold text-black/70 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-black/50 shrink-0" />
                      <span>{evt.date} • {evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-black/50 shrink-0" />
                      <span className="truncate">{evt.location || 'Campus Main'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-black/50 shrink-0" />
                      <span>
                        {evt.rsvpCount || 0} RSVPs / {evt.seatsTotal || 50} Capacity
                      </span>
                    </div>
                  </div>

                  {/* Needs Changes Reviewer Note Box */}
                  {evt.status === 'needs_changes' && evt.reviewComment && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-500 shadow-[2px_2px_0px_0px_#ef4444] text-xs">
                      <div className="flex items-center gap-1.5 font-black uppercase text-red-700 mb-1">
                        <AlertTriangle size={14} /> Administrator Feedback:
                      </div>
                      <p className="text-red-900 font-bold italic">
                        "{evt.reviewComment}"
                      </p>
                    </div>
                  )}

                  {/* Rejected Note Box */}
                  {evt.status === 'rejected' && evt.reviewComment && (
                    <div className="mb-4 p-3 bg-neutral-100 border-2 border-black text-xs">
                      <div className="flex items-center gap-1.5 font-black uppercase text-black mb-1">
                        <XCircle size={14} /> Rejection Reason:
                      </div>
                      <p className="text-black/80 font-bold italic">
                        "{evt.reviewComment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer (Strictly Organizer Portal Navigation) */}
              <div className="p-4 bg-neutral-50 border-t-3 border-black flex flex-wrap gap-2">
                {evt.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleSubmitForApproval(evt)}
                      disabled={actionLoadingId === evt.id}
                      className="flex-1 py-2 px-3 bg-pastel-mint hover:bg-green-300 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center justify-center gap-1.5"
                    >
                      <Send size={13} />
                      {actionLoadingId === evt.id ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      onClick={() => navigate(`/organizer/events/${evt.id}/edit`)}
                      className="py-2 px-3 bg-white hover:bg-pastel-yellow border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px]"
                      title="Edit Draft"
                    >
                      <FileEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(evt)}
                      disabled={actionLoadingId === evt.id}
                      className="py-2 px-3 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px]"
                      title="Delete Draft"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}

                {evt.status === 'needs_changes' && (
                  <button
                    onClick={() => navigate(`/organizer/events/${evt.id}/edit`)}
                    className="w-full py-2.5 px-3 bg-pastel-yellow hover:bg-yellow-300 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center justify-center gap-1.5"
                  >
                    <FileEdit size={14} />
                    Revise & Resubmit
                  </button>
                )}

                {evt.status === 'pending_approval' && (
                  <button
                    onClick={() => navigate(`/organizer/events/${evt.id}/edit`)}
                    className="w-full py-2 px-3 bg-neutral-200 hover:bg-neutral-300 border-2 border-black font-black text-xs uppercase text-black/80 flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px]"
                    title="View Submitted Event Draft"
                  >
                    <Clock size={13} />
                    Under Admin Review (Click to View)
                  </button>
                )}

                {evt.status === 'published' && (
                  <div className="w-full flex gap-2">
                    <button
                      onClick={() => navigate(`/organizer/events/${evt.id}/roster`)}
                      className="flex-1 py-2 px-3 bg-pastel-mint hover:bg-emerald-300 border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center justify-center gap-1.5"
                      title="Manage Attendee Roster & Check-In"
                    >
                      <Users size={13} />
                      Attendees ({evt.rsvpCount || 0})
                    </button>
                    <button
                      onClick={() => navigate(`/organizer/events/${evt.id}/edit`)}
                      className="py-2 px-3 bg-white hover:bg-pastel-yellow border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center gap-1.5"
                      title="Edit Event Details"
                    >
                      <FileEdit size={14} />
                      <span>Edit</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
};

export default OrganizerDashboard;
