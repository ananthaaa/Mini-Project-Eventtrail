import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import mockClubs from '../data/clubs.json';
import { Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Badge from '../components/ui/Badge';

const ClubDirectory = () => {
  const navigate = useNavigate();

  return (
    <PageShell>
      {/* Title Header */}
      <div className="mb-16 text-center max-w-2xl mx-auto bg-white border-3 border-black p-8 neo-shadow-lg">
        <h1 className="font-display font-black text-4xl md:text-5xl text-black uppercase tracking-tight mb-4">
          Discover Campus Clubs
        </h1>
        <p className="text-black/70 font-bold uppercase text-sm tracking-wider">
          Explore organizations, connect with peers, and find your community on campus.
        </p>
      </div>

      {/* Grid of Organizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockClubs.map((club, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={club.id}
            onClick={() => navigate(`/club/${club.id}`)}
            className="group cursor-pointer bg-white border-3 border-black flex flex-col h-full neo-shadow-sm hover:-translate-y-2 hover:neo-shadow-lg transition-all"
          >
            {/* Visual Header Grid Panel */}
            <div className={`h-40 bg-pastel-yellow border-b-3 border-black flex items-center justify-center relative bg-grid-dots`}>
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center font-display font-black text-3xl text-black z-10 border-3 border-black shadow-[4px_4px_0px_0px_#000] group-hover:scale-110 transition-transform">
                {club.logo}
              </div>
            </div>

            {/* Club Details */}
            <div className="p-6 flex flex-col justify-between grow">
              <div>
                <h3 className="font-display font-black text-2xl text-black uppercase mb-3 line-clamp-1">
                  {club.name}
                </h3>
                <p className="text-sm font-medium text-black/80 line-clamp-3 leading-relaxed mb-6">
                  {club.description}
                </p>
              </div>

              <div className="border-t-3 border-black border-dashed pt-4 flex items-center justify-between mt-auto">
                <Badge variant="mint" className="shadow-[2px_2px_0px_0px_#000]">
                  <Users size={14} className="mr-1 inline" /> {club.memberIds.length}
                </Badge>
                
                <div className="w-10 h-10 bg-accent-yellow border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-accent-yellow transition-colors shadow-[2px_2px_0px_0px_#000]">
                  <ArrowRight size={20} strokeWidth={3} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
};

export default ClubDirectory;
