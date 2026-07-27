import React from 'react';

const Marquee = ({
  items = [],
  speed = 'normal', // 'normal' | 'fast'
  className = '',
  bgClass = 'bg-black text-white py-3 border-y-3 border-black'
}) => {
  const marqueeClass = speed === 'fast' ? 'animate-marquee-fast' : 'animate-marquee';
  
  // Duplicate items to ensure smooth continuous scrolling
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className={`overflow-hidden relative w-full select-none ${bgClass} ${className}`}>
      <div className={marqueeClass}>
        {duplicatedItems.map((item, index) => (
          <span
            key={index}
            className="mx-8 font-display font-black text-lg uppercase tracking-wider inline-flex items-center gap-2 whitespace-nowrap"
          >
            {item}
            <span className="w-3 h-3 bg-accent-yellow border border-black inline-block rotate-45 ml-4" />
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
