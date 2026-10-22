import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import { fetchEvents } from '../services/apiService';
import { Search, SlidersHorizontal, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const getCampusTodayStr = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch (_) {
    return new Date().toISOString().split('T')[0];
  }
};

const isDateThisWeek = (dateStr) => {
  if (!dateStr) return false;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const dayOfWeek = now.getDay() || 7; // Monday is 1, Sunday is 7
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return target >= startOfWeek && target <= endOfWeek;
};

const EventDiscovery = () => {
  const navigate = useNavigate();
  const [apiEvents, setApiEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [timelineTab, setTimelineTab] = useState('upcoming'); // 'upcoming' | 'past' | 'all'
  const [selectedDateFilter, setSelectedDateFilter] = useState('All'); // 'All' | 'Today' | 'This Week'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFaculty, setSelectedFaculty] = useState('All');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = ['All', 'Tech', 'Sports', 'Academic', 'Arts', 'Workshop', 'Cultural'];
  const faculties = ['All', 'Science', 'Engineering', 'Medicine', 'Management', 'General'];

  const todayStr = useMemo(() => getCampusTodayStr(), []);
  const requestIdRef = useRef(0);

  const loadFilteredEvents = async () => {
    const currentReq = ++requestIdRef.current;
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = {};
      if (selectedFaculty !== 'All') params.faculty = selectedFaculty;
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const data = await fetchEvents(params);

      // Prevent stale requests from overwriting newer query results
      if (currentReq !== requestIdRef.current) return;

      setApiEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      if (currentReq !== requestIdRef.current) return;
      console.warn('API fetch failed:', error.message);
      setFetchError(error);
      setApiEvents([]);
    } finally {
      if (currentReq === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadFilteredEvents();
  }, [selectedFaculty, selectedCategory]);

  const activeFilterCount = (selectedDateFilter !== 'All' ? 1 : 0) +
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedFaculty !== 'All' ? 1 : 0) +
    (timelineTab !== 'upcoming' ? 1 : 0);

  const filteredEvents = useMemo(() => {
    return apiEvents.filter((evt) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (evt.title || '').toLowerCase().includes(q) ||
        (evt.description || '').toLowerCase().includes(q) ||
        (evt.organizerName || '').toLowerCase().includes(q) ||
        (evt.location || '').toLowerCase().includes(q);

      // 2. Timeline Tab (Upcoming vs Past)
      const eventDate = evt.date || (evt.startsAt ? evt.startsAt.split('T')[0] : '');
      const regDeadline = evt.registrationDeadline ? evt.registrationDeadline.split('T')[0] : '';
      let matchesTimeline = true;
      if (timelineTab === 'upcoming') {
        const isLiveOrUpcoming = (eventDate >= todayStr) || (regDeadline && regDeadline >= todayStr) || (!eventDate);
        matchesTimeline = isLiveOrUpcoming && evt.status !== 'completed';
      } else if (timelineTab === 'past') {
        const isPast = Boolean(eventDate && eventDate < todayStr && (!regDeadline || regDeadline < todayStr));
        matchesTimeline = isPast || evt.status === 'completed';
      }

      // 3. Date Filter (Today / This Week)
      let matchesDate = true;
      if (selectedDateFilter === 'Today') {
        matchesDate = eventDate === todayStr;
      } else if (selectedDateFilter === 'This Week') {
        matchesDate = isDateThisWeek(eventDate);
      }

      // 4. Category Filter
      const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;

      // 5. Faculty Filter
      const matchesFaculty = selectedFaculty === 'All' || evt.faculty === selectedFaculty;

      return matchesSearch && matchesTimeline && matchesDate && matchesCategory && matchesFaculty;
    });
  }, [apiEvents, searchQuery, timelineTab, selectedDateFilter, selectedCategory, selectedFaculty, todayStr]);

  const resetFilters = () => {
    setSearchQuery('');
    setTimelineTab('upcoming');
    setSelectedDateFilter('All');
    setSelectedCategory('All');
    setSelectedFaculty('All');
  };

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-8 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="yellow" className="mb-3">Campus Events</Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Discover Events
          </h1>
        </div>
        <p className="text-black/70 font-bold text-sm max-w-sm md:text-right">
          Find student activities, technical workshops, and club gatherings across campus.
        </p>
      </div>

      {/* Main Filter & Search Control */}
      <div className="bg-white border-3 border-black p-4 md:p-6 neo-shadow mb-10 flex flex-col gap-4">
        
        {/* Top Row: Search Input + Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event title, club, or venue..."
              aria-label="Search events"
              className="w-full bg-white text-black border-3 border-black py-3 pl-12 pr-4 outline-none font-bold text-sm placeholder:text-black/40 focus:bg-pastel-yellow/20 focus-visible:ring-2 focus-visible:ring-black"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-black/60 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            aria-expanded={mobileFiltersOpen}
            className="md:hidden flex items-center gap-1.5 px-4 py-3 border-3 border-black font-black uppercase text-xs bg-pastel-yellow shadow-[2px_2px_0px_0px_#000]"
          >
            <SlidersHorizontal size={14} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            {mobileFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Timeline Tabs: Upcoming vs Past */}
        <div className="flex border-2 border-black bg-gray-50 p-1 w-full sm:w-auto self-start shadow-[2px_2px_0px_0px_#000]">
          {[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'all', label: 'All Dates' },
            { id: 'past', label: 'Past Events' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimelineTab(tab.id)}
              className={`px-4 py-1.5 font-display font-black text-xs uppercase tracking-wider transition-all ${
                timelineTab === tab.id
                  ? 'bg-pastel-mint border border-black shadow-[1px_1px_0px_0px_#000]'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters (always visible on desktop, toggleable on mobile) */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t-2 border-black/10 ${
          mobileFiltersOpen ? 'block' : 'hidden md:grid'
        }`}>
          {/* Quick Date Shortcuts */}
          <div>
            <label htmlFor="filter-date" className="block text-xs font-black uppercase tracking-wider text-black/60 mb-1.5">
              Time Window
            </label>
            <div className="flex gap-2">
              {['All', 'Today', 'This Week'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedDateFilter(tab)}
                  className={`flex-1 py-2 px-2 font-display font-bold text-xs uppercase border-2 border-black transition-all ${
                    selectedDateFilter === tab
                      ? 'bg-accent-yellow shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label htmlFor="filter-category" className="block text-xs font-black uppercase tracking-wider text-black/60 mb-1.5">
              Category
            </label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white text-black border-2 border-black py-2 px-3 font-bold text-xs uppercase tracking-wider outline-none shadow-[2px_2px_0px_0px_#000] focus-visible:ring-2 focus-visible:ring-black"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Dropdown */}
          <div>
            <label htmlFor="filter-faculty" className="block text-xs font-black uppercase tracking-wider text-black/60 mb-1.5">
              Department / Faculty
            </label>
            <select
              id="filter-faculty"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full bg-white text-black border-2 border-black py-2 px-3 font-bold text-xs uppercase tracking-wider outline-none shadow-[2px_2px_0px_0px_#000] focus-visible:ring-2 focus-visible:ring-black"
            >
              {faculties.map((fac) => (
                <option key={fac} value={fac}>
                  {fac === 'All' ? 'All Faculties' : fac}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters bar */}
        {(searchQuery || selectedDateFilter !== 'All' || selectedCategory !== 'All' || selectedFaculty !== 'All' || timelineTab !== 'upcoming') && (
          <div className="flex items-center justify-between border-t border-black/10 pt-3 text-xs">
            <span className="font-bold text-black/60">
              Showing {filteredEvents.length} matching event{filteredEvents.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 font-black uppercase text-red-600 hover:underline"
            >
              <RefreshCw size={12} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Events Results Grid */}
      {isLoading ? (
        <div className="border-3 border-black bg-white p-12 text-center neo-shadow max-w-md mx-auto">
          <div className="w-10 h-10 border-4 border-black border-t-accent-yellow rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-display font-black text-xl uppercase tracking-wider">
            Loading Campus Events...
          </h3>
          <p className="text-xs font-bold text-black/60 uppercase mt-1">Checking live seat availability</p>
        </div>
      ) : fetchError ? (
        <div className="border-3 border-black bg-white p-8 text-center neo-shadow max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="font-display font-black text-xl uppercase mb-2">Unable to Load Events</h3>
          <p className="text-sm font-bold text-black/60 mb-6">
            We couldn't connect to the campus event catalog. Please check your internet connection.
          </p>
          <button
            onClick={loadFilteredEvents}
            className="py-3 px-6 bg-pastel-yellow border-3 border-black font-black uppercase text-xs tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
          >
            Retry Request
          </button>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isFull = (evt.seatsAvailable ?? 0) <= 0;
            const isPast = (evt.date || '') < todayStr || evt.status === 'completed';

            return (
              <Link
                key={evt.id}
                to={`/student/events/${evt.id}`}
                className="group flex flex-col h-full bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000] transition-all text-left overflow-hidden focus-visible:ring-2 focus-visible:ring-black"
              >
                {/* Event Cover Image */}
                <div className="h-44 border-b-3 border-black overflow-hidden relative bg-gray-100">
                  <img
                    src={evt.coverImage || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600&auto=format&fit=crop'}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge
                      variant={evt.category === 'Tech' ? 'mint' : evt.category === 'Sports' ? 'peach' : 'yellow'}
                      className="shadow-[2px_2px_0px_0px_#000] border-2 border-black"
                    >
                      {evt.category}
                    </Badge>
                    {isPast && (
                      <Badge variant="dark" className="border-2 border-black">
                        Concluded
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-5 flex flex-col justify-between grow">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-bold text-black/70">
                      <span className="bg-pastel-yellow px-2 py-0.5 border border-black font-mono">
                        {evt.date}
                      </span>
                      <span>•</span>
                      <span>{evt.time}</span>
                    </div>

                    <h3 className="font-display font-black text-xl uppercase leading-snug mb-2 text-black group-hover:text-black line-clamp-2">
                      {evt.title}
                    </h3>

                    <p className="text-sm font-normal text-black/80 leading-relaxed mb-4 line-clamp-2">
                      {evt.description || 'Join fellow students for this campus event.'}
                    </p>
                  </div>

                  <div className="border-t-2 border-black/15 pt-3 mt-auto flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-black bg-gray-100 px-2 py-1 border border-black truncate max-w-[150px]">
                      {evt.location || 'Campus'}
                    </span>

                    {isPast ? (
                      <span className="text-xs font-bold text-black/50">Past</span>
                    ) : isFull ? (
                      <Badge variant="peach" className="border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                        Waitlist Open
                      </Badge>
                    ) : (
                      <Badge variant="mint" className="border-2 border-black shadow-[1px_1px_0px_0px_#000]">
                        {evt.seatsAvailable} seats left
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border-3 border-black bg-white p-12 text-center neo-shadow max-w-lg mx-auto">
          <SlidersHorizontal className="w-12 h-12 text-black mx-auto mb-4" />
          <h3 className="font-display font-black text-xl uppercase mb-2">No Matching Events Found</h3>
          <p className="text-sm font-semibold text-black/60 mb-6">
            We couldn't find any events matching your selected criteria. Try adjusting your search query or reset filters.
          </p>
          <button
            onClick={resetFilters}
            className="py-2.5 px-5 bg-accent-yellow border-3 border-black font-display font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:translate-y-px transition-all"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </PageShell>
  );
};

export default EventDiscovery;
