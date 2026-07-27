import React, { useContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { RsvpContext } from '../context/RsvpContext';
import { Calendar, Search, MapPin, SlidersHorizontal, RefreshCw } from 'lucide-react';

const EventDiscovery = () => {
  const { events } = useContext(RsvpContext);
  const navigate = useNavigate();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All'); // 'All' | 'Today' | 'This Week'
  const [selectedCategory, setSelectedCategory] = useState('All'); // 'All' | 'Tech' | 'Sports' | 'Academic' | 'Arts'
  const [selectedFaculty, setSelectedFaculty] = useState('All'); // 'All' | 'Science' | 'Medicine' | 'All Faculties'

  // Constant filter options
  const categories = ['All', 'Tech', 'Sports', 'Academic', 'Arts'];
  const faculties = ['All', 'Science', 'Medicine', 'All Faculties'];

  // Current system date for mock filters (2026-07-10)
  const TODAY_STR = '2026-07-10';

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Search Query
      const matchesSearch =
        evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evt.organizerName.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Date Filter
      let matchesDate = true;
      if (selectedDateFilter === 'Today') {
        matchesDate = evt.date === TODAY_STR;
      } else if (selectedDateFilter === 'This Week') {
        // Simple mock check: all mock events are this week
        matchesDate = true;
      }

      // 3. Category Filter
      const matchesCategory =
        selectedCategory === 'All' || evt.category === selectedCategory;

      // 4. Faculty Filter
      const matchesFaculty =
        selectedFaculty === 'All' || evt.faculty === selectedFaculty;

      return matchesSearch && matchesDate && matchesCategory && matchesFaculty;
    });
  }, [events, searchQuery, selectedDateFilter, selectedCategory, selectedFaculty]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDateFilter('All');
    setSelectedCategory('All');
    setSelectedFaculty('All');
  };

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-10 text-left border-b-3 border-black pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Badge variant="yellow" className="mb-3">Event Catalog</Badge>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tight">
            Discover Events
          </h1>
        </div>
        <p className="text-black/60 font-semibold text-sm max-w-sm md:text-right">
          Find workshops, hackathons, and activities organized by campus clubs.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-3 border-black p-6 neo-shadow mb-12 flex flex-col gap-6">
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, or organizer..."
            className="w-full bg-white text-black border-3 border-black py-3 pl-12 pr-4 outline-none font-display font-bold text-xs uppercase tracking-wider placeholder:text-black/40 focus:bg-pastel-yellow/10"
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-black/60" />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Date Filter Tabs */}
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-black/50 mb-2">
              Filter by Date
            </span>
            <div className="flex gap-2">
              {['All', 'Today', 'This Week'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedDateFilter(tab)}
                  className={`flex-1 py-2 px-3 font-display font-bold text-xs uppercase border-2 border-black transition-all neo-shadow-sm hover:neo-shadow-sm active:translate-x-[1px] active:translate-y-[1px] ${
                    selectedDateFilter === tab
                      ? 'bg-accent-yellow text-black'
                      : 'bg-white text-black'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-black/50 mb-2">
              Category
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white text-black border-2 border-black py-2 px-3 font-display font-bold text-xs uppercase tracking-wider outline-none neo-shadow-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Faculty Filter */}
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-black/50 mb-2">
              Faculty Council
            </span>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full bg-white text-black border-2 border-black py-2 px-3 font-display font-bold text-xs uppercase tracking-wider outline-none neo-shadow-sm"
            >
              {faculties.map((fac) => (
                <option key={fac} value={fac}>
                  {fac === 'All' ? 'All Faculties' : fac}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filters button */}
        {(searchQuery || selectedDateFilter !== 'All' || selectedCategory !== 'All' || selectedFaculty !== 'All') && (
          <div className="flex justify-end border-t border-black/10 pt-4">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-black uppercase tracking-wider hover:text-red-500 transition-colors"
            >
              <RefreshCw size={12} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Events Results */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredEvents.map((evt) => (
            <Card
              key={evt.id}
              onClick={() => navigate(`/student/events/${evt.id}`)}
              variant="white"
              shadowSize="medium"
              className="flex flex-col h-full cursor-pointer hover:-translate-y-1 transition-transform"
            >
              {/* Event Cover Image */}
              <div className="h-48 border-b-3 border-black overflow-hidden relative">
                <img
                  src={evt.coverImage}
                  alt={evt.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                <Badge
                  variant={evt.category === 'Tech' ? 'mint' : evt.category === 'Sports' ? 'peach' : 'yellow'}
                  className="absolute top-3 left-3 shadow-[2px_2px_0px_0px_#000] border-2 border-black"
                >
                  {evt.category}
                </Badge>
              </div>

              {/* Event Content */}
              <div className="p-6 flex flex-col justify-between grow bg-white">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-pastel-yellow px-2 py-1 border-2 border-black text-xs font-black uppercase tracking-wider text-black">
                      {evt.date}
                    </span>
                    <span className="bg-pastel-mint px-2 py-1 border-2 border-black text-xs font-black uppercase tracking-wider text-black">
                      {evt.faculty}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-xl uppercase leading-tight mb-3 text-black">
                    {evt.title}
                  </h3>
                  <p className="text-sm font-bold text-black leading-relaxed mb-4 line-clamp-3">
                    {evt.description}
                  </p>
                </div>

                <div className="border-t-3 border-black border-dashed pt-4 mt-auto flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-black bg-pastel-peach px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                    {evt.organizerName}
                  </span>
                  
                  {evt.seatsAvailable > 0 ? (
                    <Badge variant="yellow" className="shadow-[2px_2px_0px_0px_#000] border-2 border-black">
                      {evt.seatsAvailable} left
                    </Badge>
                  ) : (
                    <Badge variant="dark" className="shadow-[2px_2px_0px_0px_#000] border-2 border-black">
                      Waitlisted
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border-3 border-black bg-white p-12 text-center neo-shadow max-w-lg mx-auto">
          <SlidersHorizontal className="w-12 h-12 text-black mx-auto mb-4" />
          <h3 className="font-display font-black text-xl uppercase mb-2">No events match</h3>
          <p className="text-sm font-semibold text-black/60 mb-6">
            Try adjusting your search query or reset your filters.
          </p>
          <button
            onClick={resetFilters}
            className="py-2.5 px-5 bg-accent-yellow border-2 border-black font-display font-bold text-xs uppercase tracking-wider neo-shadow-sm active:translate-x-[1px] active:translate-y-[1px]"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </PageShell>
  );
};

export default EventDiscovery;
