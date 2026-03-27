"use client";

// components/ButtonAnimatedGradient.jsx
import { useRef, useState } from 'react';

const Button = ({ children, variant = 'primary' }) => {
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  // Define variant styles
  const variantStyles = {
    primary: {
      border: 'border-blue-500',
      bg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      text: 'text-white',
      gradient: 'radial-gradient(100px circle at ${position.x}px ${position.y}px, #3b82f688, transparent)',
      hover: 'hover:from-blue-700 hover:to-indigo-700',
    },
    secondary: {
      border: 'border-gray-300 dark:border-gray-600',
      bg: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800',
      text: 'text-gray-800 dark:text-gray-200',
      gradient: 'radial-gradient(100px circle at ${position.x}px ${position.y}px, #9ca3af88, transparent)',
      hover: 'hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700',
    },
    danger: {
      border: 'border-red-500',
      bg: 'bg-gradient-to-r from-red-600 to-pink-600',
      text: 'text-white',
      gradient: 'radial-gradient(100px circle at ${position.x}px ${position.y}px, #ef444488, transparent)',
      hover: 'hover:from-red-700 hover:to-pink-700',
    },
    success: {
      border: 'border-green-500',
      bg: 'bg-gradient-to-r from-green-600 to-teal-600',
      text: 'text-white',
      gradient: 'radial-gradient(100px circle at ${position.x}px ${position.y}px, #10b98188, transparent)',
      hover: 'hover:from-green-700 hover:to-teal-700',
    },
    minimal: {
      border: 'border-transparent',
      bg: 'bg-transparent',
      text: 'text-gray-800 dark:text-gray-200',
      gradient: 'radial-gradient(100px circle at ${position.x}px ${position.y}px, #9ca3af88, transparent)',
      hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    },
    glass: {
      border: 'border-gray-200/50',
      bg: 'bg-white/10 backdrop-blur-md',
      text: 'text-gray-500',
      gradient: 'radial-gradient(100px circle at ${position.x}px ${position.y}px, #ffffff33, transparent)',
      hover: 'hover:bg-white/20',
    },
    neumorphic: {
      border: 'border-none',
      bg: 'bg-gray-100 dark:bg-gray-800 shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.9)] dark:shadow-[3px_3px_6px_rgba(0,0,0,0.5),-3px_-3px_6px_rgba(255,255,255,0.1)]',
      text: 'text-gray-800 dark:text-gray-200',
      gradient: 'radial-gradient(100px circle at ${position.x}px ${position.y}px, #d1d5db88, transparent)',
      hover: 'hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] dark:hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.1)]',
    },
  };

  const styles = variantStyles[variant] || variantStyles.primary;

  return (
    <button
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex w-fit mx-auto h-12 items-center justify-center overflow-hidden rounded-lg border ${styles.border} ${styles.bg} px-6 py-2 font-semibold ${styles.text} shadow-md transition-all duration-300 ease-in-out ${styles.hover} focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.text === 'text-white' ? 'focus:ring-white/50' : 'focus:ring-gray-400'}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: styles.gradient.replace('${position.x}', position.x).replace('${position.y}', position.y),
        }}
      />
      <span className="relative z-20">{children}</span>
    </button>
  );
};

export default Button;
