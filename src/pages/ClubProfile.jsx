import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { fetchClubById, fetchEvents, joinClub, leaveClub } from '../services/apiService';
import { RoleContext } from '../context/RoleContext';
import { ArrowLeft, Calendar, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../components/ui/Badge';

const ClubProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(RoleContext);
  
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [apiClub, allEvents] = await Promise.all([
          fetchClubById(id),
          fetchEvents()
        ]);
        setClub(apiClub);
        setEvents(Array.isArray(allEvents) ? allEvents.filter(e => e.organizerId === id) : []);
      } catch (error) {
        console.error('Failed to load club:', error.message);
        setClub(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleJoinToggle = async () => {
    if (!user) {
      alert("Please log in to join clubs");
      return;
    }
    
    setIsJoining(true);
    try {
      if (isMember) {
        await leaveClub(id);
        setIsMember(false);
      } else {
        await joinClub(id);
        setIsMember(true);
      }
    } catch (err) {
      console.error("Failed to toggle membership", err);
      alert("Error updating membership");
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading || !club) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <h3 className="font-display font-black uppercase text-3xl text-black mb-4">
            {isLoading ? "Loading..." : "Club Not Found"}
          </h3>
          {!isLoading && (
            <>
              <p className="text-black/70 font-bold uppercase tracking-wide mb-8">
                The student organization you are looking for does not exist or has been removed.
              </p>
              <Link to="/clubs" className="inline-flex items-center gap-2 bg-accent-yellow border-3 border-black px-6 py-3 text-black font-bold uppercase tracking-wider hover:bg-black hover:text-accent-yellow transition-colors shadow-[4px_4px_0px_0px_#000]">
                <ArrowLeft size={16} />
                Back to Directory
              </Link>
            </>
          )}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-8">
        <Link
          to="/clubs"
          className="inline-flex items-center gap-2 text-sm font-bold text-black uppercase tracking-wider hover:underline underline-offset-4 decoration-2"
        >
          <ArrowLeft size={16} />
          Back to Directory
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`lg:col-span-2 bg-pastel-mint border-3 border-black neo-shadow-lg p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8 bg-grid-dots relative`}
        >
          <div className="absolute inset-0 bg-white/20"></div>
          
          <div className="relative z-10 w-32 h-32 bg-white flex items-center justify-center font-display font-black text-5xl text-black border-3 border-black shadow-[4px_4px_0px_0px_#000] overflow-hidden">
            {club.logoUrl ? <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" /> : club.name?.substring(0, 2).toUpperCase()}
          </div>
          
          <div className="relative z-10 text-center md:text-left flex-grow">
            <div className="flex justify-center md:justify-start gap-3 mb-4">
              <Badge variant="white" className="shadow-[2px_2px_0px_0px_#000]">Chartered</Badge>
              <Badge variant="yellow" className="shadow-[2px_2px_0px_0px_#000]">Active</Badge>
            </div>
            <h1 className="font-display font-black text-4xl md:text-5xl text-black tracking-tight uppercase line-clamp-2">
              {club.name}
            </h1>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-pastel-peach border-3 border-black neo-shadow p-8 flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 mb-6 border-b-3 border-black pb-4">
            <Activity className="w-6 h-6 text-black" strokeWidth={3} />
            <h3 className="font-display font-black text-black uppercase tracking-widest text-lg">At a Glance</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <p className="text-black/60 font-bold uppercase text-sm mb-1">Members</p>
              <p className="text-4xl font-display font-black text-black">{club.memberIds?.length || 0}</p>
            </div>
            {user && (
              <button 
                onClick={handleJoinToggle}
                disabled={isJoining}
                className={`w-full py-3 font-black uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_0px_#000] transition-all ${
                  isMember 
                    ? 'bg-black text-white hover:bg-black/80' 
                    : 'bg-accent-yellow text-black hover:bg-black hover:text-accent-yellow'
                }`}
              >
                {isJoining ? 'Updating...' : (isMember ? 'Joined ✓' : 'Join Club')}
              </button>
            )}
            <div className="border-t-3 border-black border-dashed pt-4">
              <p className="text-black/60 font-bold uppercase text-sm mb-1">Hosted Events</p>
              <p className="text-4xl font-display font-black text-black">{events.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* About Club */}
          <section className="bg-white border-3 border-black p-8 neo-shadow">
            <div className="flex items-center gap-4 mb-6 border-b-3 border-black pb-4">
              <div className="bg-accent-yellow border-2 border-black w-8 h-8 flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000]">01</div>
              <h2 className="font-display font-black text-3xl text-black uppercase">About Our Club</h2>
            </div>
            <p className="text-black font-medium leading-relaxed text-lg">
              {club.description}
            </p>
          </section>

          {/* Members Showcase */}
          <section className="bg-white border-3 border-black p-8 neo-shadow">
            <div className="flex items-center gap-4 mb-6 border-b-3 border-black pb-4">
              <div className="bg-pastel-mint border-2 border-black w-8 h-8 flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000]">02</div>
              <h2 className="font-display font-black text-3xl text-black uppercase">Executive Committee</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Members API not yet implemented, showing placeholder or empty state */}
              <div className="text-black/60 font-bold uppercase text-sm col-span-2">No committee members assigned yet.</div>
            </div>
          </section>
        </div>

        {/* Right 1 Column: Hosted Events */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6 bg-white border-3 border-black p-4 neo-shadow">
            <div className="bg-pastel-peach border-2 border-black w-8 h-8 flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000]">03</div>
            <h2 className="font-display font-black text-2xl text-black uppercase tracking-tight m-0">Upcoming Events</h2>
          </div>

          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/event/${evt.id}`)}
                  className="bg-white border-3 border-black p-5 cursor-pointer hover:-translate-y-1 neo-shadow-sm hover:neo-shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 mb-3 border-b-2 border-black/20 pb-2">
                    <Calendar className="w-4 h-4 text-black" />
                    <span>{evt.date}</span>
                  </div>
                  <h3 className="font-display font-black text-xl text-black uppercase mb-4 group-hover:text-black/70 transition-colors">
                    {evt.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="yellow" className="shadow-[1px_1px_0px_0px_#000]">{evt.seatsAvailable} seats left</Badge>
                    <span className="bg-black text-white px-3 py-1 font-bold uppercase tracking-wider text-xs shadow-[2px_2px_0px_0px_#FFDB58] flex items-center gap-1">
                      Details <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-bg-neobrutalist border-3 border-black border-dashed p-8 text-center">
              <div className="w-12 h-12 bg-white border-3 border-black flex items-center justify-center mx-auto mb-4 rotate-3 shadow-[2px_2px_0px_0px_#000]">
                <Calendar className="w-6 h-6 text-black" />
              </div>
              <p className="text-black font-bold uppercase tracking-wider text-sm">No upcoming events scheduled.</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
};

export default ClubProfile;
