"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const PostAction = ({
  icon,
  text,
  onClick,
  color = 'default',
  className = '',
  isDisabled = false,
  isLoading = false,
}) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || isDisabled || isLoading) return;

    const onEnter = () => {
      gsap.to(button, { scale: 1.1, duration: 0.2, ease: "back.out(1.7)" });
    };
    const onLeave = () => {
      gsap.to(button, { scale: 1, duration: 0.2, ease: "power2.out" });
    };
    const onPress = () => {
      gsap.to(button, { scale: 0.9, duration: 0.1 });
      gsap.to(button, { scale: 1, duration: 0.1, delay: 0.1 });
    };

    button.addEventListener('mouseenter', onEnter);
    button.addEventListener('mouseleave', onLeave);
    button.addEventListener('mousedown', onPress);

    return () => {
      button.removeEventListener('mouseenter', onEnter);
      button.removeEventListener('mouseleave', onLeave);
      button.removeEventListener('mousedown', onPress);
    };
  }, [isDisabled, isLoading]);

  const colorMap = {
    default: 'hover:text-black text-gray-700',
    red: 'hover:text-red-500 text-gray-700',
    blue: 'hover:text-blue-500 text-gray-700',
    purple: 'hover:text-purple-500 text-gray-700',
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={isDisabled || isLoading}
      className={`group flex w-full flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-all duration-200 focus:outline-none ${colorMap[color]} ${className}`}
    >
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm ring-1 ring-gray-200/70 transition-all group-hover:bg-gray-50 group-hover:shadow">
        {icon}
      </span>
      {text && (
        <span className="text-[10px] sm:text-[11px] font-semibold leading-none tracking-tight">
          {text}
        </span>
      )}
    </button>
  );
};

export default PostAction;
