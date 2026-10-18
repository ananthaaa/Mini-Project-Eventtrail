import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import { createEvent, updateEvent, fetchEventById, fetchVenues, fetchClubById, fetchClubs } from '../../services/apiService';
import { RoleContext } from '../../context/RoleContext';
import ImageUploadZone from '../../components/ui/ImageUploadZone';
import CampusMap, { Marker } from '../../components/ui/CampusMap';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  X,
  MapPin,
  Building,
  Calendar,
  Clock,
  Layers,
  Users,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

const CATEGORIES = ['Tech', 'Cultural', 'Sports', 'Academic', 'Arts', 'Social', 'Workshop', 'Career'];
const FACULTIES = ['Science', 'Engineering', 'Humanities', 'Commerce', 'Design', 'General'];

const OrganizerEventForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { currentUser, clubId } = useContext(RoleContext);

  const [venues, setVenues] = useState([]);
  const [clubDetails, setClubDetails] = useState(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingStatus, setExistingStatus] = useState('draft');
  const [adminFeedback, setAdminFeedback] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00 AM - 01:00 PM');
  const [category, setCategory] = useState('Tech');
  const [faculty, setFaculty] = useState('Science');
  const [venueId, setVenueId] = useState('');
  const [locationName, setLocationName] = useState('');
  const [seatsTotal, setSeatsTotal] = useState(50);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  const [scheduleItems, setScheduleItems] = useState([
    { time: '10:00 AM', title: 'Opening & Welcome', desc: 'Introductions and briefing' },
    { time: '11:00 AM', title: 'Main Event Session', desc: 'Keynote and activities' }
  ]);

  const [mapPosition, setMapPosition] = useState({ lat: 10.1780, lng: 76.4302 });
  const [indoorSteps, setIndoorSteps] = useState([
    'Enter main campus entrance',
    'Follow corridor to ground floor lobby',
    'Room entrance on the right'
  ]);

  // Load campus venues and organizer's club
  useEffect(() => {
    fetchVenues()
      .then(data => {
        if (Array.isArray(data)) setVenues(data);
      })
      .catch(err => console.warn('Could not fetch venues:', err));

    if (clubId) {
      fetchClubById(clubId)
        .then(club => setClubDetails(club))
        .catch(err => console.warn('Could not fetch club info:', err));
    } else {
      fetchClubs()
        .then(clubs => {
          if (Array.isArray(clubs) && clubs.length > 0) {
            setClubDetails(clubs[0]);
          }
        })
        .catch(err => console.warn('Could not fetch clubs fallback:', err));
    }
  }, [clubId]);

  // Load existing event data if editing
  useEffect(() => {
    if (isEditMode) {
      setIsLoadingEvent(true);
      fetchEventById(id)
        .then(evt => {
          if (evt) {
            setTitle(evt.title || '');
            setDate(evt.date || '');
            setTime(evt.time || '');
            setCategory(evt.category || 'Tech');
            setFaculty(evt.faculty || 'Science');
            setVenueId(evt.venueId || '');
            setLocationName(evt.location || '');
            setSeatsTotal(evt.seatsTotal || 50);
            setDescription(evt.description || '');
            setCoverImage(evt.coverImage || '');
            setRegistrationDeadline(evt.registrationDeadline || '');
            setExistingStatus(evt.status || 'draft');
            setAdminFeedback(evt.reviewComment || '');

            if (evt.schedule && Array.isArray(evt.schedule) && evt.schedule.length > 0) {
              setScheduleItems(evt.schedule);
            }
            if (evt.locationDetails?.entranceLat && evt.locationDetails?.entranceLng) {
              setMapPosition({
                lat: Number(evt.locationDetails.entranceLat),
                lng: Number(evt.locationDetails.entranceLng)
              });
            }
            if (evt.locationDetails?.indoorSteps && Array.isArray(evt.locationDetails.indoorSteps)) {
              setIndoorSteps(evt.locationDetails.indoorSteps);
            }
          }
        })
        .catch(err => console.error('Failed to load event:', err))
        .finally(() => setIsLoadingEvent(false));
    }
  }, [id, isEditMode]);

  // When venue changes, update locationName and map position automatically
  const handleVenueChange = (e) => {
    const selectedId = e.target.value;
    setVenueId(selectedId);
    const selected = venues.find(v => v.id === selectedId);
    if (selected) {
      setLocationName(selected.name || selected.building);
      if (selected.lat && selected.lng) {
        setMapPosition({ lat: Number(selected.lat), lng: Number(selected.lng) });
      }
      if (Array.isArray(selected.indoorSteps) && selected.indoorSteps.length > 0) {
        setIndoorSteps(selected.indoorSteps);
      }
    }
  };

  // Schedule helpers
  const handleAddScheduleItem = () => {
    setScheduleItems(prev => [...prev, { time: '', title: '', desc: '' }]);
  };

  const handleUpdateScheduleItem = (index, field, value) => {
    setScheduleItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveScheduleItem = (index) => {
    setScheduleItems(prev => prev.filter((_, i) => i !== index));
  };

  // Indoor step helpers
  const handleAddIndoorStep = () => {
    setIndoorSteps(prev => [...prev, '']);
  };

  const handleUpdateIndoorStep = (index, value) => {
    setIndoorSteps(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveIndoorStep = (index) => {
    setIndoorSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (targetStatus) => {
    if (!title.trim()) {
      alert('Event title is required.');
      return;
    }
    if (!date) {
      alert('Event date is required.');
      return;
    }
    if (!venueId && venues.length > 0) {
      alert('Please select a verified campus venue.');
      return;
    }

    const selectedVenue = venues.find(v => v.id === venueId);
    const parsedSeats = parseInt(seatsTotal, 10) || 50;
    const activeClubId = clubId || clubDetails?.id || currentUser?.clubId || '87e5b0ed-853e-4ee8-acf6-846f77abd19d';

    const payload = {
      title: title.trim(),
      coverImage: coverImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop",
      organizerId: activeClubId,
      clubId: activeClubId,
      clubName: clubDetails?.name || 'Sports Club',
      date,
      time,
      category,
      faculty,
      venueId: venueId || selectedVenue?.id || 'campus-main',
      location: locationName || selectedVenue?.name || 'Campus Hall',
      locationDetails: {
        building: selectedVenue?.building || locationName,
        entranceLat: mapPosition.lat,
        entranceLng: mapPosition.lng,
        indoorSteps: indoorSteps.filter(s => s.trim().length > 0)
      },
      seatsTotal: parsedSeats,
      description,
      schedule: scheduleItems.filter(s => s.title.trim().length > 0),
      timezone: 'Asia/Kolkata',
      registrationDeadline: registrationDeadline || `${date}T23:59:59`,
      status: targetStatus // 'draft' or 'pending_approval'
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateEvent(id, payload);
        alert(
          targetStatus === 'pending_approval'
            ? 'Event submitted for Campus Administration review!'
            : 'Event draft updated successfully!'
        );
      } else {
        await createEvent(payload);
        alert(
          targetStatus === 'pending_approval'
            ? 'Event created and submitted for Campus Administration review!'
            : 'Event draft saved!'
        );
      }
      navigate('/organizer');
    } catch (err) {
      console.error('Failed to save event:', err);
      alert('Operation failed: ' + (err.message || 'Check connection.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <div className="w-8 h-8 border-4 border-black border-t-pastel-yellow rounded-full animate-spin mx-auto mb-3" />
          <span className="font-display font-black text-sm uppercase">Loading Event Data...</span>
        </div>
      </PageShell>
    );
  }

  const inputClass = "w-full border-3 border-black p-3 font-bold text-sm outline-none focus:bg-pastel-yellow focus-visible:ring-2 focus-visible:ring-black transition-colors";

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
          <div className="flex items-center gap-3">
            <Badge variant="yellow">
              {clubDetails?.name || 'Club Organizer'}
            </Badge>
            {isEditMode && (
              <Badge variant={existingStatus === 'published' ? 'mint' : 'peach'}>
                Current Status: {existingStatus.toUpperCase()}
              </Badge>
            )}
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight mt-2">
            {isEditMode ? 'Edit Club Event' : 'Create New Event'}
          </h1>
        </div>

        {/* Action Buttons Top */}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={isSubmitting}
            variant="secondary"
            className="py-2.5 px-4 bg-white border-3 border-black"
          >
            <Save size={16} />
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={() => handleSave('pending_approval')}
            disabled={isSubmitting}
            variant="primary"
            className="py-2.5 px-5 bg-pastel-mint border-3 border-black shadow-[3px_3px_0px_0px_#000]"
          >
            <Send size={16} />
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>

      {/* Needs Changes Alert if feedback exists */}
      {adminFeedback && (
        <div className="mb-8 p-4 bg-red-50 border-3 border-red-500 shadow-[3px_3px_0px_0px_#ef4444]">
          <div className="flex items-center gap-2 font-black uppercase text-sm text-red-800 mb-1">
            <AlertTriangle size={18} /> Platform Administrator Feedback:
          </div>
          <p className="text-sm font-bold text-red-950 italic">
            "{adminFeedback}"
          </p>
          <p className="text-xs font-bold text-red-700 mt-2 uppercase tracking-wider">
            Please make the requested adjustments below and click "Submit for Review".
          </p>
        </div>
      )}

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Left Column: Core Event Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border-3 border-black p-6 neo-shadow space-y-5">
            <h2 className="font-display font-black text-xl uppercase tracking-tight border-b-2 border-black pb-3">
              1. Event Details
            </h2>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Campus Hackathon 2026"
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Faculty / Domain
                </label>
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className={inputClass}
                >
                  {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Time Window *
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 10:00 AM - 04:00 PM"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Total Capacity (Seats)
                </label>
                <input
                  type="number"
                  min="1"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Event Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide event overview, prerequisites, what attendees should bring, etc."
                className={inputClass}
              />
            </div>
          </div>

          {/* Schedule Builder */}
          <div className="bg-white border-3 border-black p-6 neo-shadow space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h2 className="font-display font-black text-xl uppercase tracking-tight">
                2. Event Schedule Timeline
              </h2>
              <button
                type="button"
                onClick={handleAddScheduleItem}
                className="py-1 px-3 bg-pastel-yellow border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-y-[1px] flex items-center gap-1"
              >
                <Plus size={14} /> Add Slot
              </button>
            </div>

            <div className="space-y-3">
              {scheduleItems.map((item, idx) => (
                <div key={idx} className="p-3 border-2 border-black bg-neutral-50 flex items-start gap-3">
                  <div className="w-28 shrink-0">
                    <input
                      type="text"
                      placeholder="10:00 AM"
                      value={item.time}
                      onChange={(e) => handleUpdateScheduleItem(idx, 'time', e.target.value)}
                      className="w-full border-2 border-black p-2 text-xs font-bold bg-white"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Session Title"
                      value={item.title}
                      onChange={(e) => handleUpdateScheduleItem(idx, 'title', e.target.value)}
                      className="w-full border-2 border-black p-2 text-xs font-bold bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Brief session description"
                      value={item.desc}
                      onChange={(e) => handleUpdateScheduleItem(idx, 'desc', e.target.value)}
                      className="w-full border-2 border-black p-2 text-xs font-normal bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveScheduleItem(idx)}
                    className="p-2 border-2 border-black bg-red-100 hover:bg-red-400 text-black transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Venue Selection, Coordinates, and Cover */}
        <div className="space-y-6">
          {/* Venue & Map Pin */}
          <div className="bg-white border-3 border-black p-6 neo-shadow space-y-4">
            <h2 className="font-display font-black text-xl uppercase tracking-tight border-b-2 border-black pb-3">
              3. Verified Campus Venue
            </h2>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Select Campus Venue *
              </label>
              <select
                value={venueId}
                onChange={handleVenueChange}
                className={inputClass}
                required
              >
                <option value="">-- Choose Verified Venue --</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.building || 'Campus'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Specific Room / Hall / Area Name
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Main Auditorium Hall 2"
                className={inputClass}
              />
            </div>

            {/* Map Preview & Interactive Location Pin */}
            <div className="border-2 border-black overflow-hidden relative">
              <div className="bg-black text-white px-3 py-1.5 font-black text-[10px] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pastel-mint animate-pulse" />
                  Campus Location Marker (Click map or drag pin)
                </span>
                <span className="font-mono bg-neutral-800 px-2 py-0.5 rounded text-[11px]">
                  {mapPosition.lat.toFixed(4)}, {mapPosition.lng.toFixed(4)}
                </span>
              </div>
              <div className="h-64 w-full relative">
                <CampusMap
                  center={[mapPosition.lat, mapPosition.lng]}
                  zoom={17.5}
                  className="w-full h-full"
                  style={{ minHeight: '100%' }}
                  onLocationSelect={(coords) => {
                    setMapPosition({ lat: coords.lat, lng: coords.lng });
                  }}
                >
                  <Marker
                    position={[mapPosition.lat, mapPosition.lng]}
                    title={locationName || 'Marked Venue'}
                    draggable={true}
                    anchor="bottom"
                    onDragEnd={(coords) => {
                      setMapPosition({ lat: coords.lat, lng: coords.lng });
                    }}
                  >
                    <div className="flex flex-col items-center cursor-grab active:cursor-grabbing group">
                      <div className="bg-black text-pastel-yellow text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1">
                        {locationName || 'Marked Venue'} (Drag to move)
                      </div>
                      <div className="w-8 h-8 bg-[#FF5A1F] border-2 border-black rounded-full flex items-center justify-center text-white font-black text-sm shadow-[3px_3px_0px_0px_#000]">
                        📍
                      </div>
                    </div>
                  </Marker>
                </CampusMap>
              </div>
              <div className="bg-pastel-yellow border-t-2 border-black px-3 py-1 text-[11px] font-bold text-black flex items-center justify-between">
                <span>💡 Click anywhere on the map or drag the pin to mark the event location.</span>
                <button
                  type="button"
                  onClick={() => setMapPosition({ lat: 10.1780, lng: 76.4302 })}
                  className="underline hover:text-red-700 font-black cursor-pointer uppercase text-[10px]"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Indoor Navigation Guidance */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase tracking-wider">
                  Walking / Indoor Steps
                </label>
                <button
                  type="button"
                  onClick={handleAddIndoorStep}
                  className="text-[10px] font-black uppercase underline hover:text-yellow-700"
                >
                  + Add Step
                </button>
              </div>
              <div className="space-y-1.5">
                {indoorSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-black/50 w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleUpdateIndoorStep(idx, e.target.value)}
                      className="flex-1 border-2 border-black p-1.5 text-xs font-bold bg-neutral-50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIndoorStep(idx)}
                      className="p-1 border border-black text-red-600 hover:bg-red-50"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white border-3 border-black p-6 neo-shadow space-y-4">
            <h2 className="font-display font-black text-xl uppercase tracking-tight border-b-2 border-black pb-3">
              4. Event Banner Image
            </h2>
            <ImageUploadZone
              label="Upload Event Artwork (PNG, JPG, WebP)"
              prefix="events"
              value={coverImage}
              onChange={(url) => setCoverImage(url)}
            />
          </div>

          {/* Action Card Bottom */}
          <div className="bg-pastel-yellow border-3 border-black p-6 neo-shadow space-y-3">
            <h3 className="font-display font-black text-base uppercase text-black">
              Ready to submit?
            </h3>
            <p className="text-xs font-bold text-black/80 leading-relaxed">
              Once submitted, your event will enter the Campus Administration review queue. You will receive notifications when feedback is posted or when the event is approved for students.
            </p>
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                onClick={() => handleSave('pending_approval')}
                disabled={isSubmitting}
                variant="primary"
                className="w-full py-3 bg-pastel-mint border-3 border-black font-black uppercase tracking-wider text-sm shadow-[3px_3px_0px_0px_#000]"
              >
                <Send size={16} />
                {isSubmitting ? 'Submitting...' : 'Submit to Admin for Review'}
              </Button>
              <Button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={isSubmitting}
                variant="secondary"
                className="w-full py-2.5 bg-white border-2 border-black font-bold uppercase tracking-wider text-xs"
              >
                <Save size={14} />
                Save as Working Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
};

export default OrganizerEventForm;
