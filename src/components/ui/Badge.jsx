import React from 'react';

const Badge = ({
  children,
  variant = 'mint', // 'mint' | 'peach' | 'yellow' | 'accent' | 'white' | 'dark'
  className = ''
}) => {
  const baseStyle = "inline-flex items-center px-3 py-1 text-xs font-bold font-display uppercase border-2 border-black tracking-wider rounded-none select-none";
  
  const variants = {
    mint: "bg-pastel-mint text-black",
    peach: "bg-pastel-peach text-black",
    yellow: "bg-pastel-yellow text-black",
    accent: "bg-accent-yellow text-black",
    white: "bg-white text-black",
    dark: "bg-black text-white"
  };

  const currentVariant = variants[variant] || variants.mint;

  return (
    <span className={`${baseStyle} ${currentVariant} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
