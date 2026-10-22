import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageShell from '../../components/layout/PageShell';
import { createEvent, updateEvent, fetchEventById, fetchClubs, deleteEvent } from '../../services/apiService';
import { RoleContext } from '../../context/RoleContext';
import { RsvpContext } from '../../context/RsvpContext';
import ImageUploadZone from '../../components/ui/ImageUploadZone';
import { ArrowLeft, Save, Plus, X, MapPin, Building, Calendar, Clock, Layers, Users, RefreshCw, Trash2 } from 'lucide-react';
import CampusMap, { Marker } from '../../components/ui/CampusMap';

const AdminEventForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const navigate = useNavigate();
  const { currentUser } = useContext(RoleContext);
  const { venues, refreshEvents } = useContext(RsvpContext);

  const [isLoadingEvent, setIsLoadingEvent] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clubs, setClubs] = useState([]);

  // Form Fields matching Event Contract
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
  const [organizerId, setOrganizerId] = useState(currentUser?.clubId || '');
  const [status, setStatus] = useState('published'); // 'draft' | 'published' | 'registration-closed' | 'completed' | 'cancelled'
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  const [scheduleItems, setScheduleItems] = useState([
    { time: '10:00 AM', title: 'Opening Remarks', desc: 'Introductions and startup briefing.' },
    { time: '11:00 AM', title: 'Main Panel Session', desc: 'Speaker presentations and open Q&A.' }
  ]);

  const [mapPosition, setMapPosition] = useState({ lat: 10.1780, lng: 76.4302 });
  const [indoorSteps, setIndoorSteps] = useState([
    'Enter main campus entrance',
    'Follow corridor to ground floor lobby',
    'Auditorium entrance on the right'
  ]);

  // Load Clubs for organizer dropdown
  useEffect(() => {
    const loadClubs = async () => {
      try {
        const data = await fetchClubs();
        if (Array.isArray(data)) {
          setClubs(data);
        }
      } catch (err) {
        console.warn('Failed to load clubs for dropdown:', err);
      }
    };
    loadClubs();
  }, []);

  // Set default venue if not set
  useEffect(() => {
    if (!venueId && venues.length > 0) {
      const first = venues[0];
      setVenueId(first.id);
      setLocationName(first.name || first.building);
      if (first.lat && first.lng) {
        setMapPosition({ lat: first.lat, lng: first.lng });
      }
      if (Array.isArray(first.indoorSteps) && first.indoorSteps.length > 0) {
        setIndoorSteps(first.indoorSteps);
      }
    }
  }, [venues, venueId]);

  // If in Edit Mode, fetch existing event data
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
            setFaculty(evt.faculty || 'General');
            setVenueId(evt.venueId || '');
            setLocationName(evt.location || '');
            setSeatsTotal(evt.seatsTotal || 50);
            setDescription(evt.description || '');
            setCoverImage(evt.coverImage || '');
            setOrganizerId(evt.organizerId || '');
            setStatus(evt.status || 'published');
            setRegistrationDeadline(evt.registrationDeadline || '');
            if (Array.isArray(evt.schedule) && evt.schedule.length > 0) {
              setScheduleItems(evt.schedule);
            }
            if (evt.locationDetails?.indoorSteps) {
              setIndoorSteps(evt.locationDetails.indoorSteps);
            }
            if (evt.locationDetails?.entranceLat && evt.locationDetails?.entranceLng) {
              setMapPosition({ lat: evt.locationDetails.entranceLat, lng: evt.locationDetails.entranceLng });
            }
          }
        })
        .catch(err => {
          console.error('Failed to load event for editing:', err);
          alert('Could not load event: ' + err.message);
        })
        .finally(() => {
          setIsLoadingEvent(false);
        });
    }
  }, [id, isEditMode]);

  const handleVenueChange = (selectedId) => {
    setVenueId(selectedId);
    const found = venues.find(v => v.id === selectedId);
    if (found) {
      setLocationName(found.name || found.building);
      if (found.lat && found.lng) {
        setMapPosition({ lat: found.lat, lng: found.lng });
      }
      if (Array.isArray(found.indoorSteps) && found.indoorSteps.length > 0) {
        setIndoorSteps(found.indoorSteps);
      }
    }
  };

  const handleAddIndoorStep = () => {
    setIndoorSteps((prev) => [...prev, '']);
  };

  const handleRemoveIndoorStep = (idx) => {
    setIndoorSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleIndoorStepChange = (idx, value) => {
    setIndoorSteps((prev) =>
      prev.map((step, i) => (i === idx ? value : step))
    );
  };

  const handleAddScheduleRow = () => {
    setScheduleItems((prev) => [
      ...prev,
      { time: '12:00 PM', title: 'Session Slot', desc: 'Describe session slot.' }
    ]);
  };

  const handleRemoveScheduleRow = (idx) => {
    setScheduleItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleScheduleChange = (idx, field, value) => {
    setScheduleItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) {
      alert('Please fill out all required fields: Title, Date, and Time.');
      return;
    }

    const parsedSeats = parseInt(seatsTotal, 10);
    if (isNaN(parsedSeats) || parsedSeats <= 0) {
      alert('Total seats must be a positive number greater than 0.');
      return;
    }

    const randomCovers = [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=600&auto=format&fit=crop"
    ];
    const finalCover = coverImage || randomCovers[0];

    const selectedVenue = venues.find(v => v.id === venueId);

    const eventPayload = {
      title: title.trim(),
      coverImage: finalCover,
      organizerId: organizerId || currentUser?.clubId || 'platform-admin',
      date,
      time,
      category,
      faculty,
      venueId: venueId || 'campus-main',
      location: locationName || selectedVenue?.name || 'Campus Grounds',
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
      status
    };

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateEvent(id, eventPayload);
        await refreshEvents();
        alert('Event updated successfully!');
      } else {
        await createEvent(eventPayload);
        await refreshEvents();
        alert('Event published successfully to campus network!');
      }
      navigate('/admin');
    } catch (err) {
      console.error('Failed to save event:', err);
      alert('Error saving event: ' + (err.message || 'Check administrator permissions.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete event "${title || 'this event'}"? All attendee records and bookings will be removed.`)) return;
    setIsSubmitting(true);
    try {
      await deleteEvent(id, true);
      await refreshEvents();
      alert('Event deleted successfully.');
      navigate('/admin');
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event: ' + (err.message || 'Check administrator permissions.'));
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <div className="w-8 h-8 border-4 border-black border-t-pastel-mint rounded-full animate-spin mx-auto mb-3" />
          <span className="font-display font-black text-sm uppercase">Loading Event Parameters...</span>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-8 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black mb-3 hover:underline"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Back to Dashboard
          </Link>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight text-black">
            {isEditMode ? 'Edit Campus Event' : 'Create Campus Event'}
          </h1>
        </div>
        <p className="text-black/70 font-bold text-sm max-w-sm md:text-right">
          Standardized event schema with validated venue coordinates, schedule, and capacity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto text-left" noValidate>
        {/* Core Event Parameters */}
        <div className="bg-white border-3 border-black p-6 md:p-8 neo-shadow space-y-6">
          <h2 className="font-display font-black text-xl uppercase border-b-2 border-black pb-2 flex items-center gap-2">
            <Calendar size={18} strokeWidth={2.5} />
            Event Overview & Timing
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="evt-title" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Event Title *
              </label>
              <input
                id="evt-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ASIET Tech Innovation Summit 2026"
                className="w-full border-3 border-black p-3 font-bold text-sm outline-none focus:bg-pastel-yellow transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="evt-date" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Date (YYYY-MM-DD) *
                </label>
                <input
                  id="evt-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none focus:bg-pastel-yellow transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="evt-time" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Time Slot *
                </label>
                <input
                  id="evt-time"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="10:00 AM - 01:00 PM"
                  className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none focus:bg-pastel-yellow transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="evt-capacity" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Total Capacity (Seats) *
                </label>
                <input
                  id="evt-capacity"
                  type="number"
                  min="1"
                  value={seatsTotal}
                  onChange={(e) => setSeatsTotal(e.target.value)}
                  className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none focus:bg-pastel-yellow transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="evt-category" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  id="evt-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none bg-white"
                >
                  {['Tech', 'Sports', 'Academic', 'Arts', 'Workshop', 'Cultural'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="evt-faculty" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Faculty / Council
                </label>
                <select
                  id="evt-faculty"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none bg-white"
                >
                  {['Science', 'Engineering', 'Medicine', 'Management', 'General'].map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="evt-status" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                  Lifecycle Status
                </label>
                <select
                  id="evt-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none bg-white"
                >
                  <option value="published">Published (Open for RSVP)</option>
                  <option value="draft">Draft (Unlisted)</option>
                  <option value="registration-closed">Registration Closed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Organizer Club Selection */}
            <div>
              <label htmlFor="evt-organizer" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Organizing Club / Association
              </label>
              <select
                id="evt-organizer"
                value={organizerId}
                onChange={(e) => setOrganizerId(e.target.value)}
                className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none bg-white"
              >
                {clubs.length > 0 ? (
                  clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))
                ) : (
                  <option value={currentUser?.clubId || 'platform-admin'}>
                    {currentUser?.clubId || 'Platform Admin'}
                  </option>
                )}
              </select>
            </div>

            <div>
              <label htmlFor="evt-description" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Event Description & Overview
              </label>
              <textarea
                id="evt-description"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive overview of agenda, prerequisites, and keynote speakers..."
                className="w-full border-3 border-black p-3 font-medium text-sm outline-none focus:bg-pastel-yellow transition-colors"
              />
            </div>

            {/* Event Artwork / Banner Image */}
            <div className="pt-2">
              <ImageUploadZone
                label="Event Banner Artwork (PNG, JPG, WebP, SVG)"
                prefix="events"
                value={coverImage}
                onChange={(url) => setCoverImage(url)}
              />
            </div>
          </div>
        </div>

        {/* Venue Selection & Campus Waypoints */}
        <div className="bg-white border-3 border-black p-6 md:p-8 neo-shadow space-y-6">
          <h2 className="font-display font-black text-xl uppercase border-b-2 border-black pb-2 flex items-center gap-2">
            <Building size={18} strokeWidth={2.5} />
            Venue & Campus Navigation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="evt-venue" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Select Campus Venue *
              </label>
              <select
                id="evt-venue"
                value={venueId}
                onChange={(e) => handleVenueChange(e.target.value)}
                className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none bg-white mb-4"
              >
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name || v.building} ({v.category || 'Campus'})</option>
                ))}
              </select>

              <label htmlFor="evt-locname" className="block text-xs font-black uppercase tracking-wider mb-1.5">
                Venue Location Display Label
              </label>
              <input
                id="evt-locname"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Science Auditorium A"
                className="w-full border-3 border-black p-2.5 font-bold text-sm outline-none focus:bg-pastel-yellow transition-colors mb-4"
              />

              <div className="p-3 bg-pastel-yellow/30 border-2 border-black text-xs font-bold space-y-1">
                <p className="font-black uppercase">Coordinates:</p>
                <p className="font-mono">Lat: {mapPosition.lat.toFixed(6)}, Lng: {mapPosition.lng.toFixed(6)}</p>
              </div>
            </div>

            {/* Indoor Turn-by-Turn Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider">
                  Indoor Walking Steps
                </label>
                <button
                  type="button"
                  onClick={handleAddIndoorStep}
                  className="text-xs font-black uppercase tracking-wider text-black bg-pastel-mint px-2 py-1 border border-black shadow-[1px_1px_0px_0px_#000]"
                >
                  + Add Step
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto p-1">
                {indoorSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-mono font-black">{idx + 1}.</span>
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleIndoorStepChange(idx, e.target.value)}
                      placeholder={`Step ${idx + 1} instruction...`}
                      className="flex-1 border-2 border-black p-1.5 text-xs font-bold outline-none"
                    />
                    {indoorSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIndoorStep(idx)}
                        className="p-1 hover:bg-red-100 text-red-600 border border-black"
                        title="Remove Step"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Builder */}
        <div className="bg-white border-3 border-black p-6 md:p-8 neo-shadow space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h2 className="font-display font-black text-xl uppercase flex items-center gap-2">
              <Clock size={18} strokeWidth={2.5} />
              Session Schedule
            </h2>
            <button
              type="button"
              onClick={handleAddScheduleRow}
              className="text-xs font-black uppercase tracking-wider text-black bg-pastel-yellow px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-y-px transition-all"
            >
              + Add Session Slot
            </button>
          </div>

          <div className="space-y-4">
            {scheduleItems.map((item, idx) => (
              <div key={idx} className="bg-gray-50 border-2 border-black p-4 relative shadow-[2px_2px_0px_0px_#000]">
                {scheduleItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveScheduleRow(idx)}
                    className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50"
                    title="Remove Session"
                  >
                    <X size={16} />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-black/60 mb-1">Time</label>
                    <input
                      type="text"
                      value={item.time}
                      onChange={(e) => handleScheduleChange(idx, 'time', e.target.value)}
                      className="w-full border-2 border-black p-1.5 font-bold text-xs"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-black/60 mb-1">Session Title</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleScheduleChange(idx, 'title', e.target.value)}
                      className="w-full border-2 border-black p-1.5 font-bold text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-black/60 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.desc}
                    onChange={(e) => handleScheduleChange(idx, 'desc', e.target.value)}
                    className="w-full border-2 border-black p-1.5 text-xs font-medium"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-3 border-black">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/admin"
              className="w-full sm:w-auto px-6 py-3 border-3 border-black font-black uppercase text-xs tracking-wider bg-white shadow-[2px_2px_0px_0px_#000] text-center"
            >
              Cancel
            </Link>
            {isEditMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 border-3 border-black font-black uppercase text-xs tracking-wider bg-red-100 hover:bg-red-500 hover:text-white shadow-[2px_2px_0px_0px_#000] text-center flex items-center justify-center gap-1.5 transition-colors"
                title="Permanently Delete Event"
              >
                <Trash2 size={14} />
                Delete Event
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-pastel-mint border-3 border-black font-black uppercase text-sm tracking-wider shadow-[4px_4px_0px_0px_#000] hover:translate-y-px transition-all flex items-center justify-center gap-2"
          >
            <Save size={16} strokeWidth={3} />
            {isSubmitting ? 'Saving Event...' : (isEditMode ? 'Update Event Record' : 'Publish Live Event')}
          </button>
        </div>
      </form>
    </PageShell>
  );
};

export default AdminEventForm;
