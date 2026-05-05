"use client";

import Logo from "../UI/Logo";

export default function AuthHeader({ subtitle, className = "" }) {
  const tagline = "Connect, share, and grow together.";

  return (
    <div className={`sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in-up ${className}`}>
      <Logo
        variant="full"
        alt="Sangya logo"
        className="mx-auto h-24 sm:h-28 md:h-32 w-auto drop-shadow-[0_12px_30px_rgba(56,189,248,0.35)] transition-transform duration-300 hover:scale-[1.02]"
      />
      <p className="mt-3 text-sm md:text-base font-semibold text-gray-700 tracking-wide">
        {tagline}
      </p>
      {subtitle && (
        <p className="mt-1.5 text-sm md:text-base text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}
