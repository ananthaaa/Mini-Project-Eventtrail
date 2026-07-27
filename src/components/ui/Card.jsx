import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  onClick,
  variant = 'white', // 'white' | 'mint' | 'peach' | 'yellow' | 'accent' | 'transparent'
  className = '',
  shadowSize = 'medium', // 'small' | 'medium' | 'large' | 'none'
  hoverEffect = true
}) => {
  const baseStyle = "neo-border transition-all duration-200 select-none overflow-hidden relative";
  
  const variants = {
    white: "bg-white text-black",
    mint: "bg-pastel-mint text-black",
    peach: "bg-pastel-peach text-black",
    yellow: "bg-pastel-yellow text-black",
    accent: "bg-accent-yellow text-black",
    transparent: "bg-transparent text-black"
  };

  const shadows = {
    none: "",
    small: "neo-shadow-sm",
    medium: "neo-shadow",
    large: "neo-shadow-lg"
  };

  const currentVariant = variants[variant] || variants.white;
  const currentShadow = shadows[shadowSize] || shadows.medium;

  const hoverClass = hoverEffect && onClick
    ? "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:neo-shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:neo-shadow-sm cursor-pointer"
    : hoverEffect
      ? "hover:-translate-x-[1px] hover:-translate-y-[1px] hover:neo-shadow-lg"
      : "";

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${currentVariant} ${currentShadow} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
