"use client";

import React from "react";

export default function Logo({ className = "", alt, variant, ...props }) {
  const src = variant === "full" ? "/real_logo.png" : "/only_logo.png";

  return (
    <img
      src={src}
      alt={alt || "Sangya logo"}
      className={["block", "object-contain", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
