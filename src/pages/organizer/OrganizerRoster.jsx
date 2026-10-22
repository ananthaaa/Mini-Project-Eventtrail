import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { fetchEvents, fetchEventRsvps, checkInAttendee } from '../../services/apiService';
import { RoleContext } from '../../context/RoleContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Download,
  QrCode,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const OrganizerRoster = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, clubId } = useContext(RoleContext);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(id || '');
  const [rsvps, setRsvps] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInStatus, setCheckInStatus] = useState({ message: '', error: false });
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Load events for this organizer/club
  useEffect(() => {
    fetchEvents({ status: 'all' })
      .then(data => {
        if (Array.isArray(data)) {
          const targetClubId = clubId || currentUser?.clubId;
          const targetEmail = currentUser?.email?.trim().toLowerCase();
          const targetUserId = currentUser?.id;
          const targetClubName = (currentUser?.clubName || '')?.trim().toLowerCase();

          const clubEvts = data.filter(evt => {
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

          setEvents(clubEvts);
          if (clubEvts.length > 0) {
            if (!selectedEventId || !clubEvts.some(e => e.id === selectedEventId)) {
              setSelectedEventId(clubEvts[0].id);
            }
          } else {
            setSelectedEventId('');
            setRsvps([]);
          }
        }
      })
      .catch(err => console.error('Failed to load organizer events:', err))
      .finally(() => setIsLoadingEvents(false));
  }, [clubId, currentUser, selectedEventId]);

  // Load RSVPs for the selected event
  const loadRsvps = useCallback(async (eventId) => {
    if (!eventId) return;
    setIsLoadingRoster(true);
    try {
      const data = await fetchEventRsvps(eventId);
      if (Array.isArray(data)) {
        setRsvps(data);
      } else {
        setRsvps([]);
      }
    } catch (err) {
      console.warn('Could not fetch event RSVPs:', err.message);
      setRsvps([]);
    } finally {
      setIsLoadingRoster(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadRsvps(selectedEventId);
    }
  }, [selectedEventId, loadRsvps]);

  const handleManualCheckIn = async (e) => {
    e.preventDefault();
    if (!checkInCode.trim() || !selectedEventId) return;

    setIsCheckingIn(true);
    setCheckInStatus({ message: '', error: false });

    try {
      await checkInAttendee(selectedEventId, { checkInCode: checkInCode.trim() });
      setCheckInStatus({ message: `Attendee checked in successfully!`, error: false });
      setCheckInCode('');
      await loadRsvps(selectedEventId);
    } catch (err) {
      setCheckInStatus({ message: err.message || 'Check-in code not found or already verified.', error: true });
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleExportCsv = () => {
    if (rsvps.length === 0) {
      alert('No attendees to export.');
      return;
    }

    const currentEvt = events.find(e => e.id === selectedEventId);
    const headers = ['Attendee Name', 'Campus Email', 'Student ID', 'Status', 'Check-In Code', 'Registered At'];
    const rows = rsvps.map(r => [
      `"${r.userName || r.name || 'Anonymous'}"`,
      `"${r.userEmail || r.email || ''}"`,
      `"${r.studentId || ''}"`,
      `"${r.status || 'confirmed'}"`,
      `"${r.checkInCode || ''}"`,
      `"${r.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roster-${currentEvt?.title ? currentEvt.title.replace(/\s+/g, '-').toLowerCase() : 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRsvps = rsvps.filter(r => {
    const term = searchTerm.toLowerCase();
    const name = (r.userName || r.name || '').toLowerCase();
    const email = (r.userEmail || r.email || '').toLowerCase();
    const code = (r.checkInCode || '').toLowerCase();
    return name.includes(term) || email.includes(term) || code.includes(term);
  });

  const checkedInCount = rsvps.filter(r => r.status === 'checked_in' || r.checkedIn).length;
  const currentEvent = events.find(e => e.id === selectedEventId);

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-8 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
          <Link
            to="/organizer"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black mb-3 hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Organizer Dashboard
          </Link>
          <Badge variant="mint" className="mb-3 block w-fit">
            Club Event Rosters
          </Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Attendee Rosters & Check-In
          </h1>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={handleExportCsv}
            disabled={rsvps.length === 0}
            variant="secondary"
            className="py-2.5 px-4 bg-white border-3 border-black shadow-[2px_2px_0px_0px_#000]"
          >
            <Download size={16} />
            Export CSV
          </Button>
          <button
            onClick={() => loadRsvps(selectedEventId)}
            className="py-2.5 px-4 bg-pastel-yellow border-3 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={isLoadingRoster ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Event Selection & Check-In Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 text-left">
        {/* Left: Event Selector */}
        <div className="lg:col-span-2 bg-white border-3 border-black p-5 neo-shadow space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-black">
            Select Club Event
          </label>
          <select
            value={selectedEventId}
            disabled={events.length === 0}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              if (e.target.value) {
                navigate(`/organizer/events/${e.target.value}/roster`, { replace: true });
              }
            }}
            className="w-full border-3 border-black p-3 font-bold text-sm bg-pastel-mint/20 outline-none focus:bg-pastel-yellow disabled:bg-neutral-100 disabled:cursor-not-allowed"
          >
            {events.length === 0 ? (
              <option value="">No events created by this club yet</option>
            ) : (
              events.map(evt => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.date}) — [{evt.status.toUpperCase()}]
                </option>
              ))
            )}
          </select>

          {currentEvent && (
            <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold text-black/70">
              <div><span className="font-black text-black">Venue:</span> {currentEvent.location}</div>
              <div><span className="font-black text-black">Confirmed:</span> {rsvps.length} / {currentEvent.seatsTotal || 50}</div>
              <div><span className="font-black text-black">Checked In:</span> {checkedInCount}</div>
            </div>
          )}
        </div>

        {/* Right: Quick Code Check-In */}
        <div className="bg-pastel-yellow border-3 border-black p-5 neo-shadow space-y-3">
          <label className="block text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <QrCode size={16} /> Fast Check-In by Code
          </label>
          <form onSubmit={handleManualCheckIn} className="flex gap-2">
            <input
              type="text"
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value)}
              placeholder="e.g. TKT-9481"
              className="flex-1 border-3 border-black p-2 font-mono font-bold text-sm uppercase bg-white outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isCheckingIn || !checkInCode.trim()}
              className="py-2 px-3 text-xs"
            >
              Verify
            </Button>
          </form>
          {checkInStatus.message && (
            <p className={`text-xs font-bold ${checkInStatus.error ? 'text-red-600' : 'text-green-700'}`}>
              {checkInStatus.message}
            </p>
          )}
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white border-3 border-black p-4 neo-shadow mb-6 flex items-center gap-3">
        <Search size={18} className="text-black/50 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter attendees by name, campus email, or ticket code..."
          className="w-full font-bold text-sm outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs font-black uppercase underline hover:text-black/60 shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      {/* Roster Table */}
      {isLoadingRoster ? (
        <div className="text-center py-20 font-display font-black text-xl uppercase">
          Loading Attendee Roster...
        </div>
      ) : filteredRsvps.length === 0 ? (
        <div className="bg-white border-3 border-black p-12 text-center neo-shadow">
          <p className="font-display font-black text-xl uppercase text-black mb-1">
            {events.length === 0 ? 'No Club Events Found' : 'No attendees found'}
          </p>
          <p className="text-xs font-bold text-black/60 uppercase tracking-wider mb-4">
            {events.length === 0
              ? 'This club has not created any events yet. Create an event to begin managing attendee rosters.'
              : rsvps.length === 0
              ? 'No students have RSVPed to this event yet.'
              : 'No records match your search query.'}
          </p>
          {events.length === 0 && (
            <Link
              to="/organizer/events/new"
              className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-pastel-mint border-3 border-black font-display font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000] hover:bg-emerald-300"
            >
              Create First Event
            </Link>
          )}
        </div>
      ) : (
        <div className="border-3 border-black bg-white neo-shadow overflow-x-auto text-left">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider">
                <th className="py-4 px-6 border-b border-black">Student Name</th>
                <th className="py-4 px-6 border-b border-black">Campus Email</th>
                <th className="py-4 px-6 border-b border-black">Check-In Code</th>
                <th className="py-4 px-6 border-b border-black text-center">Status</th>
                <th className="py-4 px-6 border-b border-black text-center">Action</th>
                <th className="py-4 px-6 border-b border-black text-right">RSVP Date</th>
              </tr>
            </thead>
            <tbody className="font-bold text-xs uppercase tracking-wider text-black/80">
              {filteredRsvps.map((rsvp, idx) => {
                const isCheckedIn = rsvp.status === 'checked_in' || rsvp.checkedIn;
                return (
                  <tr key={rsvp.id || idx} className="border-b-2 border-black/10 hover:bg-neutral-50 transition-colors">
                    <td className="py-4 px-6 font-black text-sm text-black">
                      {rsvp.userName || rsvp.name || 'Campus Student'}
                    </td>
                    <td className="py-4 px-6 lowercase font-mono">
                      {rsvp.userEmail || rsvp.email || '—'}
                    </td>
                    <td className="py-4 px-6 font-mono font-black text-xs">
                      {rsvp.checkInCode ? (
                        <span className="px-2 py-1 bg-pastel-yellow border border-black shadow-[1px_1px_0px_0px_#000]">
                          {rsvp.checkInCode}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant={isCheckedIn ? 'mint' : 'yellow'}>
                        {isCheckedIn ? 'Checked In' : 'Confirmed'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800">
                          <CheckCircle2 size={13} className="text-emerald-700" />
                          Admitted
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await checkInAttendee(selectedEventId, { checkInCode: rsvp.checkInCode || rsvp.id });
                              await loadRsvps(selectedEventId);
                            } catch (err) {
                              alert(err.message);
                            }
                          }}
                          className="px-2.5 py-1 bg-pastel-mint border border-black font-black uppercase text-[10px] shadow-[1px_1px_0px_0px_#000] hover:bg-emerald-300 cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right text-black/50 font-mono text-[11px]">
                      {rsvp.createdAt ? new Date(rsvp.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
};

export default OrganizerRoster;
