"use client";

import React from "react";

export default function AuthFooter() {
  return (
    <p>
      (c) {new Date().getFullYear()} Sangya. All rights reserved.{" "}
      <a
        href="/terms"
        className="text-blue-600 hover:text-blue-700 transition-colors"
      >
        Terms
      </a>{" "}
      |{" "}
      <a
        href="/privacy"
        className="text-blue-600 hover:text-blue-700 transition-colors"
      >
        Privacy
      </a>
    </p>
  );
}
