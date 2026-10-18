import React, { useState, useEffect, useCallback } from 'react';
import PageShell from '../../components/layout/PageShell';
import { fetchEvents, reviewEvent } from '../../services/apiService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import CampusMap, { Marker } from '../../components/ui/CampusMap';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  Users,
  Eye,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

const AdminReviewQueue = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'request_changes' | 'reject'
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterMode, setFilterMode] = useState('pending'); // 'pending' | 'all'

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchEvents({ status: 'all' });
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Failed to load review queue:', err);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const pendingEvents = events.filter(e => e.status === 'pending_approval');
  const displayedEvents = filterMode === 'pending' ? pendingEvents : events;

  const handleOpenReviewModal = (evt, action) => {
    setSelectedEvent(evt);
    setReviewAction(action);
    setReviewComment('');
  };

  const handleExecuteReview = async () => {
    if (!selectedEvent || !reviewAction) return;

    if ((reviewAction === 'request_changes' || reviewAction === 'reject') && !reviewComment.trim()) {
      alert('Please provide a review comment explaining what needs to be changed or why the event was rejected.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewEvent(selectedEvent.id, {
        action: reviewAction,
        reviewComment: reviewComment.trim()
      });

      alert(
        reviewAction === 'approve'
          ? `Event "${selectedEvent.title}" approved and published to students!`
          : `Event "${selectedEvent.title}" updated and feedback sent to club organizer.`
      );

      setSelectedEvent(null);
      setReviewAction(null);
      await loadQueue();
    } catch (err) {
      console.error('Failed to execute review action:', err);
      alert('Review action failed: ' + (err.message || 'Check administrator permissions.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-8 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <Badge variant="mint" className="mb-3">
            Governance & Compliance
          </Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Event Approval Queue
          </h1>
          <p className="text-sm font-bold text-black/60 mt-2 uppercase tracking-wider">
            Review event proposals from club organizers before publishing to student discovery
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
            <button
              onClick={() => setFilterMode('pending')}
              className={`py-2 px-3 font-black text-xs uppercase tracking-wider ${
                filterMode === 'pending' ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
              }`}
            >
              Pending ({pendingEvents.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`py-2 px-3 font-black text-xs uppercase tracking-wider border-l-2 border-black ${
                filterMode === 'all' ? 'bg-black text-white' : 'text-black hover:bg-neutral-100'
              }`}
            >
              All Events ({events.length})
            </button>
          </div>
          <button
            onClick={loadQueue}
            disabled={isLoading}
            className="py-2 px-4 bg-white hover:bg-pastel-yellow border-3 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Queue List */}
      {isLoading ? (
        <div className="text-center py-20 font-display font-black text-2xl uppercase">
          Loading Approval Queue...
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="bg-white border-3 border-black p-12 text-center neo-shadow">
          <CheckCircle2 size={48} className="text-green-600 mx-auto mb-3" />
          <h2 className="font-display font-black text-2xl uppercase text-black mb-1">
            Queue Clear!
          </h2>
          <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
            There are currently no events awaiting administrative review.
          </p>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          {displayedEvents.map((evt) => {
            const isPending = evt.status === 'pending_approval';
            const lat = Number(evt.locationDetails?.entranceLat || 10.1780);
            const lng = Number(evt.locationDetails?.entranceLng || 76.4302);

            return (
              <div
                key={evt.id}
                className={`bg-white border-3 border-black neo-shadow overflow-hidden transition-all ${
                  isPending ? 'border-l-8 border-l-pastel-yellow' : ''
                }`}
              >
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Details */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isPending ? 'yellow' : (evt.status === 'published' ? 'mint' : 'peach')}>
                        {evt.status.toUpperCase()}
                      </Badge>
                      <Badge variant="white">
                        Organizer: {evt.organizerId || 'Club'}
                      </Badge>
                      <span className="text-xs font-black uppercase text-black/50 ml-auto font-mono">
                        ID: {evt.id}
                      </span>
                    </div>

                    <h2 className="font-display font-black text-2xl uppercase tracking-tight text-black">
                      {evt.title}
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-black/80 bg-neutral-50 p-3 border-2 border-black">
                      <div>
                        <span className="text-[10px] text-black/50 block uppercase">Date & Time</span>
                        {evt.date} • {evt.time}
                      </div>
                      <div>
                        <span className="text-[10px] text-black/50 block uppercase">Venue</span>
                        {evt.location || 'Campus Hall'}
                      </div>
                      <div>
                        <span className="text-[10px] text-black/50 block uppercase">Category & Seats</span>
                        {evt.category} • {evt.seatsTotal || 50} Seats
                      </div>
                    </div>

                    <p className="text-xs font-bold text-black/70 leading-relaxed">
                      {evt.description || 'No description provided.'}
                    </p>

                    {/* Indoor Navigation Steps */}
                    {evt.locationDetails?.indoorSteps && evt.locationDetails.indoorSteps.length > 0 && (
                      <div className="text-xs font-bold text-black/80">
                        <span className="text-[10px] font-black uppercase text-black/60 block mb-1">
                          Walking / Indoor Steps:
                        </span>
                        <ol className="list-decimal list-inside space-y-0.5 text-black/70">
                          {evt.locationDetails.indoorSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Previous Feedback if any */}
                    {evt.reviewComment && (
                      <div className="p-3 bg-neutral-100 border-2 border-black text-xs font-bold">
                        <span className="font-black uppercase text-black block mb-0.5">Last Review Note:</span>
                        <p className="italic text-black/80">"{evt.reviewComment}"</p>
                      </div>
                    )}
                  </div>

                  {/* Right Col: Map & Review Actions */}
                  <div className="flex flex-col justify-between space-y-4">
                    <div className="border-2 border-black overflow-hidden h-44 relative bg-neutral-100">
                      <div className="bg-black text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 absolute top-0 left-0 z-10">
                        Venue Coordinates: {lat.toFixed(4)}, {lng.toFixed(4)}
                      </div>
                      <CampusMap center={[lat, lng]} zoom={17} className="w-full h-full">
                        <Marker position={[lat, lng]} title={evt.location} />
                      </CampusMap>
                    </div>

                    {/* Review Actions */}
                    <div className="space-y-2 pt-2">
                      <Button
                        type="button"
                        onClick={() => handleOpenReviewModal(evt, 'approve')}
                        variant="primary"
                        className="w-full py-2.5 bg-pastel-mint border-3 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]"
                      >
                        <CheckCircle2 size={16} />
                        Approve & Publish to Students
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => handleOpenReviewModal(evt, 'request_changes')}
                          variant="secondary"
                          className="flex-1 py-2 bg-pastel-yellow border-2 border-black text-xs font-black uppercase tracking-wider"
                        >
                          <AlertTriangle size={14} />
                          Request Changes
                        </Button>

                        <Button
                          type="button"
                          onClick={() => handleOpenReviewModal(evt, 'reject')}
                          variant="secondary"
                          className="py-2 px-3 bg-red-100 hover:bg-red-400 hover:text-white border-2 border-black text-xs font-black uppercase tracking-wider"
                          title="Reject Event"
                        >
                          <XCircle size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      {selectedEvent && reviewAction && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-lg w-full neo-shadow text-left space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="font-display font-black text-xl uppercase tracking-tight text-black">
                {reviewAction === 'approve' && 'Confirm Event Approval'}
                {reviewAction === 'request_changes' && 'Request Event Changes'}
                {reviewAction === 'reject' && 'Reject Event Proposal'}
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 font-black text-sm uppercase hover:underline"
              >
                Close
              </button>
            </div>

            <p className="text-xs font-bold text-black/70">
              Event: <span className="font-black text-black uppercase">{selectedEvent.title}</span> ({selectedEvent.date})
            </p>

            {reviewAction === 'approve' ? (
              <div className="p-3 bg-pastel-mint border-2 border-black text-xs font-bold">
                Approving this event will immediately publish it to the student discovery catalog and enable ticket RSVPs across campus.
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Review Comment / Instructions for Club Organizer *
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    reviewAction === 'request_changes'
                      ? 'Explain what needs adjustment (e.g. reschedule due to conflicting auditorium booking, add faculty advisor info)...'
                      : 'Provide justification for rejecting this proposal...'
                  }
                  className="w-full border-3 border-black p-3 font-bold text-xs outline-none focus:bg-pastel-yellow"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="py-2 px-4 border-2 border-black font-bold uppercase text-xs"
              >
                Cancel
              </button>
              <Button
                type="button"
                onClick={handleExecuteReview}
                disabled={isSubmitting}
                variant="primary"
                className={`py-2 px-5 border-3 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] ${
                  reviewAction === 'reject' ? 'bg-red-400 text-white' : 'bg-pastel-mint'
                }`}
              >
                {isSubmitting ? 'Processing...' : (
                  reviewAction === 'approve' ? 'Approve & Publish' : 'Submit Review Note'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default AdminReviewQueue;
