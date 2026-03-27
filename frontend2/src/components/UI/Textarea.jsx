"use client";

// src/components/UI/Textarea.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import PropTypes from "prop-types";

const Textarea = ({
  variant = "default", // default, minimalist, vibrant, bordered
  value = "",
  onChange = () => {},
  onFocus = () => {},
  onBlur = () => {},
  onInput = () => {},
  placeholder = "Enter text...",
  rows = 4,
  className = "",
  disabled = false,
  ...props
}) => {
  const textareaRef = useRef(null);
  const placeholderRef = useRef(null);
  const effectRef = useRef(null);

  const normalizedVariant = ["default", "minimalist", "vibrant", "bordered"].includes(variant)
    ? variant
    : "default";

  useEffect(() => {
    const textarea = textareaRef.current;
    const placeholder = placeholderRef.current;
    const effect = effectRef.current;

    // Placeholder animation
    gsap.to(placeholder, {
      opacity: value ? 0 : 1,
      duration: 0.2,
      ease: "power2.out",
    });

    const animations = {
      default: {
        focus: () => ({
          placeholder: { y: -20, scale: 0.9, color: "#3B82F6", duration: 0.3 },
          effect: { borderColor: "#3B82F6", duration: 0.3 },
        }),
        blur: () => ({
          placeholder: { y: 0, scale: 1, color: "#6B7280", opacity: value ? 0 : 1, duration: 0.3 },
          effect: { borderColor: "#D1D5DB", duration: 0.3 },
        }),
      },
      minimalist: {
        focus: () => ({
          textarea: { scale: 1.02, duration: 0.3 },
          placeholder: { y: -20, scale: 0.9, color: "#10B981", duration: 0.3 },
          effect: { scaleX: 1, backgroundColor: "#10B981", duration: 0.3 },
        }),
        blur: () => ({
          textarea: { scale: 1, duration: 0.3 },
          placeholder: { y: 0, scale: 1, color: "#6B7280", opacity: value ? 0 : 1, duration: 0.3 },
          effect: { scaleX: 0, duration: 0.3 },
        }),
      },
      vibrant: {
        focus: () => ({
          placeholder: { y: -20, scale: 0.9, color: "#EC4899", duration: 0.3, ease: "bounce.out" },
          effect: {
            opacity: 1,
            boxShadow: "0 0 15px rgba(236, 72, 153, 0.5)",
            borderColor: "#EC4899",
            duration: 0.5,
            repeat: -1,
            yoyo: true,
          },
        }),
        blur: () => ({
          placeholder: { y: 0, scale: 1, color: "#9CA3AF", opacity: value ? 0 : 1, duration: 0.3 },
          effect: { opacity: 0, boxShadow: "0 0 0 rgba(236, 72, 153, 0)", borderColor: "#E5E7EB", duration: 0.5 },
        }),
      },
      bordered: {
        focus: () => ({
          placeholder: { y: -20, scale: 0.9, color: "#8B5CF6", duration: 0.3 },
          effect: { borderWidth: 4, borderColor: "#8B5CF6", boxShadow: "0 0 10px rgba(139, 92, 246, 0.3)", duration: 0.3 },
        }),
        blur: () => ({
          placeholder: { y: 0, scale: 1, color: "#6B7280", opacity: value ? 0 : 1, duration: 0.3 },
          effect: { borderWidth: 2, borderColor: "#D1D5DB", boxShadow: "0 0 0 rgba(139, 92, 246, 0)", duration: 0.3 },
        }),
      },
    };

    const handleFocus = () => {
      onFocus(textarea);
      const { textarea: taAnim, placeholder: plAnim, effect: efAnim } = animations[normalizedVariant].focus();
      if (taAnim) gsap.to(textarea, { ...taAnim, ease: "power2.out" });
      gsap.to(placeholder, { ...plAnim, ease: "power2.out" });
      gsap.to(effect, { ...efAnim, ease: "power2.out" });
    };

    const handleBlur = () => {
      onBlur(textarea);
      const { textarea: taAnim, placeholder: plAnim, effect: efAnim } = animations[normalizedVariant].blur();
      if (taAnim) gsap.to(textarea, { ...taAnim, ease: "power2.out" });
      gsap.to(placeholder, { ...plAnim, ease: "power2.out" });
      gsap.to(effect, { ...efAnim, ease: "power2.out", clearProps: normalizedVariant === "vibrant" ? "borderColor" : "" });
    };

    textarea.addEventListener("focus", handleFocus);
    textarea.addEventListener("blur", handleBlur);

    return () => {
      textarea.removeEventListener("focus", handleFocus);
      textarea.removeEventListener("blur", handleBlur);
    };
  }, [normalizedVariant, value, onFocus, onBlur]);

  const handleChange = (e) => {
    onChange(e);
    onInput(e);
  };

  const baseClasses = `w-full p-4 text-lg text-gray-900 font-content resize-y focus:outline-none ${className} ${
    disabled ? "opacity-50 cursor-not-allowed" : ""
  }`;

  const variantClasses = {
    default: "bg-white border-2 border-gray-300 rounded-md",
    minimalist: "bg-transparent border-none",
    vibrant: "bg-white rounded-lg",
    bordered: "bg-white rounded-md",
  };

  const effectClasses = {
    default: "absolute inset-0 rounded-md border-2 border-gray-300 z-[-1]",
    minimalist: "absolute bottom-0 left-0 w-full h-0.5 bg-transparent transform scale-x-0 origin-left z-[-1]",
    vibrant: "absolute inset-0 rounded-lg border-2 border-gray-200 opacity-0 z-[-1]",
    bordered: "absolute inset-0 rounded-md border-2 border-gray-300 z-[-1]",
  };

  return (
    <div className="relative w-full">
      <div ref={effectRef} className={effectClasses[normalizedVariant]} />
      <textarea
        ref={textareaRef}
        className={`${baseClasses} ${variantClasses[normalizedVariant]}`}
        value={value}
        onChange={handleChange}
        placeholder=" "
        rows={rows}
        disabled={disabled}
        {...props}
      />
      <span
        ref={placeholderRef}
        className={`absolute left-4 top-4 text-gray-500 transition-all pointer-events-none ${
          normalizedVariant === "vibrant" ? "z-10" : ""
        }`}
      >
        {placeholder}
      </span>
    </div>
  );
};

Textarea.propTypes = {
  variant: PropTypes.oneOf(["default", "minimalist", "vibrant", "bordered"]),
  value: PropTypes.string,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onInput: PropTypes.func,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default Textarea;
