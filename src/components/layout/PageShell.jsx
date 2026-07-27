import React from 'react';
import { motion } from 'framer-motion';

const PageShell = ({ children, className = '', useGridPattern = true }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`min-h-[70vh] flex flex-col relative w-full ${useGridPattern ? 'bg-grid-dots' : ''} ${className}`}
    >
      <div className="grow w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
        {children}
      </div>
    </motion.div>
  );
};

export default PageShell;
