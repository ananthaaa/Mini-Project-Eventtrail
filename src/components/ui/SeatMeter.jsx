import React from 'react';
import { motion } from 'framer-motion';

export default function SeatMeter({ total, available }) {
  const filled = total - available;
  const percentage = Math.max(0, Math.min(100, (filled / total) * 100));
  
  return (
    <div className="w-full bg-bg-surface p-4 rounded-xl border border-border-subtle">
      <div className="flex justify-between items-end mb-2">
        <span className="text-text-secondary text-sm font-medium uppercase tracking-wider">Seats Filled</span>
        <span className="text-text-primary text-xl font-display font-semibold">{filled} / {total}</span>
      </div>
      <div className="h-3 w-full bg-bg-primary rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${percentage >= 100 ? 'bg-red-500' : 'bg-accent'} rounded-full`}
        />
      </div>
      {percentage >= 100 && (
        <p className="text-red-400 text-xs mt-2 text-right">Event is at full capacity. Join waitlist.</p>
      )}
    </div>
  );
}
