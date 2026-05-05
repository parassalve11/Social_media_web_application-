"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useNavigate } from "react-router-dom";

const DropdownComponent = ({
  triggerElement,
  options = [],
  onSelect,
  variant = "default",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const optionsRef = useRef(null);
  const navigate = useNavigate();
  const [dropdownPosition, setDropdownPosition] = useState({ horizontal: "right", vertical: "bottom" });
  const [leftOffset, setLeftOffset] = useState(8); // Store leftOffset in state to use in style

  // Toggle dropdown visibility with trigger animation
  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Toggling dropdown, isOpen:", !isOpen); // Debug log
    if (triggerRef.current) {
      gsap.fromTo(
        triggerRef.current,
        { scale: 1, backgroundColor: variant === "button" ? "#fff1ad" : "transparent" },
        {
          scale: 1.05,
          backgroundColor: variant === "button" ? "#e6d89c" : "#f0f0f0",
          duration: 0.2,
          ease: "power1.out",
          onComplete: () => {
            gsap.to(triggerRef.current, {
              scale: 1,
              backgroundColor: variant === "button" ? "#fff1ad" : "transparent",
              duration: 0.2,
            });
            setIsOpen((prev) => !prev);
          },
        }
      );
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  // Handle option selection or navigation
  const handleSelect = (value, href, element) => {
    console.log("Selected:", { value, href }); // Debug log
    gsap.to(element, {
      scale: 0.95,
      duration: 0.1,
      onComplete: () => {
        gsap.to(element, { scale: 1, duration: 0.1 });
        if (onSelect) onSelect(value);
        if (href) navigate(href);
        setIsOpen(false);
      },
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        console.log("Closing dropdown due to outside click"); // Debug log
        setIsOpen(false);
      }
    };

    const eventType = window.innerWidth < 640 ? "touchstart" : "mousedown";
    document.addEventListener(eventType, handleClickOutside);
    return () => {
      document.removeEventListener(eventType, handleClickOutside);
    };
  }, []);

  // Dynamically adjust dropdown position and size based on viewport
  useEffect(() => {
    const updatePosition = () => {
      if (triggerRef.current && optionsRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const dropdownRect = optionsRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth < 640; // Define isMobile here

        // Set dropdown width based on screen size
        const dropdownWidth = isMobile
          ? Math.min(180, viewportWidth - 16)
          : Math.min(240, viewportWidth - 16);

        // Determine horizontal position
        let horizontal = isMobile ? "center" : "right"; // Center on mobile for better visibility
        const spaceRight = viewportWidth - triggerRect.right;
        const spaceLeft = triggerRect.left;

        if (!isMobile) {
          if (spaceRight < dropdownWidth && spaceLeft >= dropdownWidth) {
            horizontal = "left";
          } else if (spaceRight < dropdownWidth && spaceLeft < dropdownWidth) {
            horizontal = "center";
          }
        }

        // Determine vertical position
        let vertical = "bottom";
        if (triggerRect.bottom + dropdownRect.height > viewportHeight - 8) {
          vertical = "top";
        }

        // Calculate left offset for positioning
        let _leftOffset = 8; // Prefix with _ to comply with linter
        if (horizontal === "center") {
          _leftOffset = `calc(50% - ${dropdownWidth / 2}px)`;
        } else if (horizontal === "left") {
          _leftOffset = "auto";
        } else if (isMobile) {
          _leftOffset = Math.max(8, triggerRect.left - (dropdownWidth - triggerRect.width) / 2);
        }

        setDropdownPosition({ horizontal, vertical });
        setLeftOffset(_leftOffset); // Store leftOffset for use in style

        if (optionsRef.current) {
          optionsRef.current.style.width = `${dropdownWidth}px`;
          optionsRef.current.style.minWidth = isMobile ? "150px" : "200px";
          optionsRef.current.style.maxWidth = `${viewportWidth - 16}px`;
        }
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen]);

  // GSAP animation for dropdown
  useEffect(() => {
    if (optionsRef.current) {
      const isMobile = window.innerWidth < 640;
      gsap.to(optionsRef.current, {
        y: isOpen ? 0 : (dropdownPosition.vertical === "top" ? 10 : -10),
        opacity: isOpen ? 1 : 0,
        scale: isMobile ? 1 : isOpen ? 1 : 0.98,
        duration: isMobile ? 0.15 : 0.3,
        ease: isOpen ? "power2.out" : "power2.in",
        display: isOpen ? "block" : "none",
      });
    }
  }, [isOpen, dropdownPosition]);

  // Variant-specific classes and styles
  const getVariantStyles = () => {
    switch (variant) {
      case "minimal":
        return "border border-[#fff1ad]/30 rounded-md shadow-sm bg-white text-sm";
      case "button":
        return "bg-[#fff1ad] hover:bg-[#e6d89c] text-black rounded-md shadow-md transition-colors duration-200 px-4 py-2";
      case "card":
        return "bg-white rounded-lg shadow-xl border border-[#fff1ad]/20 p-2 text-base";
      case "stacked":
        return "bg-white rounded-md shadow-lg border border-[#fff1ad]/20 flex flex-col items-start text-base";
      default:
        return "bg-white rounded-md shadow-lg border border-[#fff1ad]/20 text-sm";
    }
  };

  return (
    <div className={`relative inline-block z-[2000] ${className}`} ref={dropdownRef}>
      {/* Trigger Element with Animation */}
      <div
        ref={triggerRef}
        onClick={handleToggle}
        className={`cursor-pointer ${variant === "default" ? "" : getVariantStyles()}`}
      >
        {React.cloneElement(triggerElement, {
          className: `${triggerElement.props.className || ""} ${
            variant === "button" ? "px-4 py-2" : ""
          }`,
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleToggle(e);
          },
        })}
      </div>

      {/* Dropdown Options with Dynamic Positioning, Icons, and Links */}
      <div
        ref={optionsRef}
        className={`absolute mt-1 max-w-[calc(100vw-16px)] ${getVariantStyles()} overflow-hidden`}
        style={{
          display: isOpen ? "block" : "none",
          top: dropdownPosition.vertical === "top" ? "auto" : "100%",
          bottom: dropdownPosition.vertical === "top" ? "100%" : "auto",
          left: leftOffset,
          right:
            dropdownPosition.horizontal === "center" || dropdownPosition.horizontal === "right"
              ? "auto"
              : 8,
          transform: dropdownPosition.horizontal === "center" ? "translateX(-50%)" : "none",
          zIndex: 2000,
        }}
      >
        {options.map((option, index) => (
          <div
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelect(option.value, option.href, e.currentTarget);
            }}
            className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors duration-200 no-underline ${
              variant === "minimal"
                ? "text-gray-700 hover:bg-[#fff1ad]/20 active:bg-[#fff1ad]/30"
                : variant === "card" || variant === "stacked"
                ? "text-gray-700 hover:bg-[#fff1ad]/30 rounded-md active:bg-[#fff1ad]/40"
                : "text-gray-700 hover:bg-[#fff1ad]/40 active:bg-[#fff1ad]/50"
            } text-sm sm:text-xs`}
          >
            {option.icon && <span className="text-base sm:text-sm">{option.icon}</span>}
            {option.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DropdownComponent;
