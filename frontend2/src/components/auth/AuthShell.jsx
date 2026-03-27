"use client";

import React from "react";

export default function AuthShell({
  header,
  children,
  footer,
  className = "",
  cardClassName = "",
}) {
  return (
    <div
      className={`min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 ${className}`}
    >
      <div className="pointer-events-none absolute -top-24 -left-28 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -right-24 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_40%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          {header}
          <div
            className={`rounded-3xl border border-white/70 bg-white/80 p-7 sm:p-9 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_26px_80px_rgba(15,23,42,0.18)] ${cardClassName}`}
          >
            {children}
          </div>
          {footer && (
            <div className="text-center text-xs text-gray-500">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
