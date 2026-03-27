"use client";


import React, { useEffect } from "react";





const AvatarComponent = ({
  src = "https://cdn.pixabay.com/photo/2017/07/18/23/23/user-2517430_1280.png", // Default placeholder image
  alt = "User Avatar", // Alt text for accessibility
  size = "40px", // Customizable size (e.g., "40px", "2rem")
  fallbackText = "", // Fallback text (e.g., initials) if image fails
  className = "", // Additional custom classes
  onClick, // Optional click handler
}) => {
  const [hasError, setHasError] = React.useState(false);
  const isBadSrc =
    !src || (typeof src === "string" && src.includes("via.placeholder.com"));
  const safeSrc = isBadSrc ? "/avatar.svg" : src;

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Handle image load error by switching to fallback text
  const handleError = () => {
    setHasError(true);
  };

  // Generate initials from fallbackText
  const getInitials = (text) => {
    if (!text) return "";
    const names = text.split(" ");
    return names
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2); // Limit to 2 characters
  };

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-200 ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {!hasError ? (
        <img
          src={safeSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleError}
        />
      ) : (
        <span className="text-white font-medium text-sm">
          {getInitials(fallbackText)}
        </span>
      )}
    </div>
  );
};

export default AvatarComponent;
