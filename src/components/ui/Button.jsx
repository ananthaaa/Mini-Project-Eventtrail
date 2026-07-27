import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'outline'
  className = '',
  disabled = false,
  type = 'button'
}) => {
  const baseStyle = "font-display font-bold text-sm tracking-wide uppercase py-3 px-6 neo-border transition-all duration-100 flex items-center justify-center gap-2 select-none outline-none";
  
  const variants = {
    primary: "bg-accent-yellow text-black neo-shadow hover:neo-shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:neo-shadow-sm",
    secondary: "bg-white text-black neo-shadow hover:neo-shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:neo-shadow-sm",
    accent: "bg-pastel-peach text-black neo-shadow hover:neo-shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:neo-shadow-sm",
    outline: "bg-transparent text-black hover:bg-black/5 active:translate-x-[1px] active:translate-y-[1px]"
  };

  const currentVariant = variants[variant] || variants.primary;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${currentVariant} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;
