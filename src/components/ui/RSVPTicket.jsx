import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock } from 'lucide-react';
import Badge from './Badge';

export default function RSVPTicket({ event, rsvpStatus, ticketNumber }) {
  const isWaitlist = rsvpStatus === 'Waitlisted';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative w-full overflow-hidden bg-white border-3 border-black p-6 neo-shadow-sm hover:neo-shadow transition-all group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="pr-4">
          <h3 className="text-black text-xl font-display font-black uppercase mb-1 line-clamp-2">{event.title}</h3>
          <p className="text-black/70 text-xs font-bold uppercase tracking-wider">{event.date} • {event.time}</p>
        </div>
        <div className={`p-2 border-3 border-black shrink-0 ${isWaitlist ? 'bg-pastel-peach shadow-[2px_2px_0px_0px_#000]' : 'bg-pastel-mint shadow-[2px_2px_0px_0px_#000]'}`}>
          {isWaitlist ? <Clock className="w-6 h-6 text-black" strokeWidth={2.5} /> : <CheckCircle className="w-6 h-6 text-black" strokeWidth={2.5} />}
        </div>
      </div>

      <div className="border-t-3 border-dashed border-black/30 my-4 relative">
        <div className="absolute top-1/2 -left-8 w-6 h-6 bg-neobrutalist border-3 border-black border-l-0 rounded-r-full transform -translate-y-1/2"></div>
        <div className="absolute top-1/2 -right-8 w-6 h-6 bg-neobrutalist border-3 border-black border-r-0 rounded-l-full transform -translate-y-1/2"></div>
      </div>

      <div className="flex justify-between items-end mt-4">
        <div>
          <p className="text-black/50 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
          {isWaitlist ? (
             <Badge variant="yellow" className="shadow-[1px_1px_0px_0px_#000]">Waitlisted</Badge>
          ) : (
             <Badge variant="mint" className="shadow-[1px_1px_0px_0px_#000]">Confirmed</Badge>
          )}
        </div>
        {ticketNumber && (
          <div className="text-right">
            <p className="text-black/50 text-xs font-bold uppercase tracking-wider mb-1">Ticket No.</p>
            <p className="text-black font-display font-black text-sm bg-pastel-yellow border-2 border-black px-2 py-1 shadow-[1px_1px_0px_0px_#000]">{ticketNumber}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
