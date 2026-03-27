"use client";

import React, {
  useRef,
  useEffect,
  useState,
  cloneElement,
} from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";

const PLACEMENTS = ["top", "bottom", "left", "right"];

const Tooltip = ({
  children,
  content,

  // Control
  open,
  defaultOpen = false,
  onOpenChange,

  // Positioning
  placement = "top",
  offset = 8,
  followCursor = false,

  // Timing
  delayOpen = 200,
  delayClose = 150,

  // UI
  variant = "dark",
  arrow = true,
  arrowSize = 8,

  // Behavior
  portal = true,
  animation = "gsap", // "css"
  className = "",
}) => {
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const arrowRef = useRef(null);
  const timeoutRef = useRef(null);

  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;

  const setOpenState = (value) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  /* -------------------------------------------------- */
  /* POSITIONING */
  /* -------------------------------------------------- */

  const calculatePosition = (x, y) => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const tr = trigger.getBoundingClientRect();
    const tt = tooltip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const positions = {
      top: {
        top: tr.top - tt.height - offset,
        left: tr.left + tr.width / 2 - tt.width / 2,
      },
      bottom: {
        top: tr.bottom + offset,
        left: tr.left + tr.width / 2 - tt.width / 2,
      },
      left: {
        top: tr.top + tr.height / 2 - tt.height / 2,
        left: tr.left - tt.width - offset,
      },
      right: {
        top: tr.top + tr.height / 2 - tt.height / 2,
        left: tr.right + offset,
      },
    };

    let best = placement;
    for (const p of PLACEMENTS) {
      const pos = positions[p];
      if (
        pos.top >= 0 &&
        pos.left >= 0 &&
        pos.top + tt.height <= vh &&
        pos.left + tt.width <= vw
      ) {
        best = p;
        break;
      }
    }

    const finalPos = followCursor && x && y
      ? { top: y + 12, left: x + 12 }
      : positions[best];

    tooltip.style.top = `${finalPos.top}px`;
    tooltip.style.left = `${finalPos.left}px`;

    tooltip.dataset.placement = best;
  };

  /* -------------------------------------------------- */
  /* OPEN / CLOSE */
  /* -------------------------------------------------- */

  const show = (e) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setOpenState(true);
      requestAnimationFrame(() =>
        calculatePosition(e?.clientX, e?.clientY)
      );
    }, delayOpen);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setOpenState(false),
      delayClose
    );
  };

  /* -------------------------------------------------- */
  /* EFFECTS */
  /* -------------------------------------------------- */

  useEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    if (isOpen) {
      if (animation === "gsap") {
        gsap.fromTo(
          tooltip,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.2 }
        );
      }
    }
  }, [isOpen, animation]);

  /* -------------------------------------------------- */
  /* EVENTS */
  /* -------------------------------------------------- */

  const triggerProps = {
    ref: triggerRef,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    onMouseMove: followCursor ? calculatePosition : undefined,
    "aria-describedby": "tooltip",
  };

  /* -------------------------------------------------- */
  /* RENDER */
  /* -------------------------------------------------- */

  const tooltipNode = isOpen && (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={`
        fixed z-[9999] pointer-events-none
        px-3 py-2 rounded-md text-sm
        transition-all
        ${variant === "dark" && "bg-gray-900 text-white"}
        ${variant === "light" && "bg-white text-black shadow-lg"}
        ${className}
      `}
    >
      {content}

      {arrow && (
        <div
          ref={arrowRef}
          className="absolute rotate-45"
          style={{
            width: arrowSize,
            height: arrowSize,
          }}
        />
      )}
    </div>
  );

  return (
    <>
      {cloneElement(children, triggerProps)}
      {portal ? createPortal(tooltipNode, document.body) : tooltipNode}
    </>
  );
};

export default Tooltip;
