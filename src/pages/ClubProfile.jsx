import React, { useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { RsvpContext } from '../context/RsvpContext';
import mockClubs from '../data/clubs.json';
import mockSpeakers from '../data/speakers.json';
import { ArrowLeft, Users, Calendar, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../components/ui/Badge';

const ClubProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events } = useContext(RsvpContext);

  const club = mockClubs.find((c) => c.id === id);

  if (!club) {
    return (
      <PageShell>
        <div className="max-w-md mx-auto text-center mt-20 bg-white border-3 border-black p-8 neo-shadow">
          <h3 className="font-display font-black uppercase text-3xl text-black mb-4">Club Not Found</h3>
          <p className="text-black/70 font-bold uppercase tracking-wide mb-8">
            The student organization you are looking for does not exist or has been removed.
          </p>
          <Link to="/clubs" className="inline-flex items-center gap-2 bg-accent-yellow border-3 border-black px-6 py-3 text-black font-bold uppercase tracking-wider hover:bg-black hover:text-accent-yellow transition-colors shadow-[4px_4px_0px_0px_#000]">
            <ArrowLeft size={16} />
            Back to Directory
          </Link>
        </div>
      </PageShell>
    );
  }

  // Load members and hosted events
  const members = mockSpeakers.filter((spk) => club.memberIds.includes(spk.id));
  const hostedEvents = events.filter((evt) => evt.organizerId === club.id);

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
        {/* Banner with Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`lg:col-span-2 bg-pastel-mint border-3 border-black neo-shadow-lg p-8 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-8 bg-grid-dots relative`}
        >
          <div className="absolute inset-0 bg-white/20"></div>
          
          <div className="relative z-10 w-32 h-32 bg-white flex items-center justify-center font-display font-black text-5xl text-black border-3 border-black shadow-[4px_4px_0px_0px_#000]">
            {club.logo}
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

        {/* Club Statistics Card */}
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
              <p className="text-4xl font-display font-black text-black">{club.memberIds.length}</p>
            </div>
            <div className="border-t-3 border-black border-dashed pt-4">
              <p className="text-black/60 font-bold uppercase text-sm mb-1">Hosted Events</p>
              <p className="text-4xl font-display font-black text-black">{hostedEvents.length}</p>
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
              {members.map((member) => (
                <div key={member.id} className="bg-pastel-yellow border-3 border-black p-4 flex items-center gap-4 neo-shadow-sm hover:translate-x-1 hover:-translate-y-1 hover:neo-shadow transition-all">
                  <div
                    className="w-14 h-14 border-3 border-black flex items-center justify-center font-display font-black text-2xl shadow-[2px_2px_0px_0px_#000]"
                    style={{ backgroundColor: member.avatarColor, color: '#fff' }}
                  >
                    {member.avatarText}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-black text-lg uppercase line-clamp-1">
                      {member.name}
                    </h3>
                    <span className="text-black/70 font-bold uppercase text-xs tracking-wider">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 1 Column: Hosted Events */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-6 bg-white border-3 border-black p-4 neo-shadow">
            <div className="bg-pastel-peach border-2 border-black w-8 h-8 flex items-center justify-center font-black shadow-[2px_2px_0px_0px_#000]">03</div>
            <h2 className="font-display font-black text-2xl text-black uppercase tracking-tight m-0">Upcoming Events</h2>
          </div>

          {hostedEvents.length > 0 ? (
            <div className="space-y-4">
              {hostedEvents.map((evt) => (
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
