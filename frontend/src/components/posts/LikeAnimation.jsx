"use client";

// components/Post/LikeAnimation.jsx
import React, { useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { gsap } from "gsap";

const LikeAnimation = ({ show, onComplete }) => {
  const containerRef = useRef(null);
  const heartRef = useRef(null);

  useEffect(() => {
    if (!show || !containerRef.current || !heartRef.current) return;

    const container = containerRef.current;
    const heart = heartRef.current;

    // Create particles
    const particles = [];
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("div");
      particle.className = "absolute w-2 h-2 rounded-full bg-red-400";
      particle.style.left = "50%";
      particle.style.top = "50%";
      container.appendChild(particle);
      particles.push(particle);
    }

    // Animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        particles.forEach((p) => p.remove());
        onComplete?.();
      },
    });

    // Heart animation
    tl.fromTo(
      heart,
      { scale: 0, opacity: 0, rotation: -30 },
      {
        scale: 1.5,
        opacity: 1,
        rotation: 0,
        duration: 0.4,
        ease: "back.out(2)",
      }
    )
      .to(heart, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
      })
      .to(
        heart,
        {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        },
        "+=0.3"
      );

    // Particles explosion
    particles.forEach((particle, i) => {
      const angle = (360 / particles.length) * i;
      const distance = 60;
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;

      tl.to(
        particle,
        {
          x,
          y,
          opacity: 0,
          scale: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        0.2
      );
    });

    return () => {
      tl.kill();
      particles.forEach((p) => p.remove());
    };
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div ref={heartRef}>
        <Heart
          size={80}
          className="text-red-500 fill-red-500 drop-shadow-lg"
        />
      </div>
    </div>
  );
};

export default LikeAnimation;
