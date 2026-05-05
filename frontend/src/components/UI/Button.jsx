"use client";

import React from 'react';

const Button = ({
  children,
  variant = 'solid',
  color = 'default',
  size = 'md',
  fullWidth = false,
  isDisabled = false,
  isLoading = false,
  startContent,
  className = '',
  ...props
}) => {
  // Tailwind CSS classes
  const baseClasses = 'flex items-center justify-center gap-2 font-medium transition-colors duration-200';
  const variantClasses = {
    solid: {
      default: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      danger: 'bg-red-500 text-white hover:bg-red-600',
    },
    outline: {
      default: 'border border-gray-300 bg-transparent text-gray-800 hover:bg-gray-100',
      primary: 'border border-blue-500 bg-transparent text-blue-500 hover:bg-blue-50',
      danger: 'border border-red-500 bg-transparent text-red-500 hover:bg-red-50',
    },
    ghost: {
      default: 'bg-transparent text-gray-800 hover:bg-gray-100',
      primary: 'bg-transparent text-blue-500 hover:bg-blue-50',
      danger: 'bg-transparent text-red-500 hover:bg-red-50',
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm rounded-md',
    md: 'px-3 py-1.5 text-base rounded-md',
    lg: 'px-4 py-2 text-lg rounded-md',
  };

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';
  const fullWidthClass = fullWidth ? 'w-full' : '';

  // Validate variant and color
  const validVariant = variantClasses[variant] ? variant : 'solid';
  const validColor = variantClasses[validVariant][color] ? color : 'default';

  const buttonClasses = [
    baseClasses,
    variantClasses[validVariant][validColor],
    sizeClasses[size],
    disabledClasses,
    fullWidthClass,
    className,
  ].join(' ');

  // Simple spinner for loading state
  const Spinner = () => (
    <svg
      className={`animate-spin mr-2 ${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner />}
      {startContent}
      {children}
    </button>
  );
};

export default Button;
