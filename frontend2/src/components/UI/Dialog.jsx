"use client";

// frontend/src/components/UI/Dialog.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertTriangle, Info } from "lucide-react";

const Dialog = ({
  isOpen,
  onClose,
  headline,
  description,
  actionText,
  onAction,
  variant = "default",
  actionIcon = null,
  isLoading = false,
  children,
}) => {
  /* Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  /* Scroll lock */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const config = {
    default: {
      icon:       <Info className="w-5 h-5 text-blue-500" />,
      iconBg:     "bg-blue-50",
      actionBtn:  "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md shadow-blue-200",
    },
    danger: {
      icon:       <AlertTriangle className="w-5 h-5 text-red-500" />,
      iconBg:     "bg-red-50",
      actionBtn:  "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-md shadow-red-200",
    },
    warning: {
      icon:       <AlertTriangle className="w-5 h-5 text-amber-500" />,
      iconBg:     "bg-amber-50",
      actionBtn:  "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-amber-200",
    },
  };

  const cfg = config[variant] ?? config.default;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* backdrop */}
          <Motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* dialog */}
          <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 pointer-events-none">
            <Motion.div
              key="dialog"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="pointer-events-auto w-full max-w-md bg-white rounded-3xl shadow-2xl
                border border-gray-100 overflow-hidden"
              style={{ maxHeight: "90vh", overflowY: "auto" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* blue top accent */}
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600" />

              <div className="p-6">
                {/* header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center`}>
                      {cfg.icon}
                    </div>
                    {headline && (
                      <h2 className="text-lg font-bold text-gray-900">{headline}</h2>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center
                      text-gray-400 hover:text-gray-600 hover:bg-gray-100
                      transition-all ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {description && (
                  <p className="text-gray-500 text-sm leading-relaxed mb-5">{description}</p>
                )}

                {children && (
                  <div className="mb-5">{children}</div>
                )}

                {actionText && onAction && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-sm font-medium
                        text-gray-500 hover:text-gray-700 hover:bg-gray-100
                        transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onAction}
                      disabled={isLoading}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold
                        flex items-center gap-2 transition-all
                        disabled:opacity-40 disabled:cursor-not-allowed
                        ${cfg.actionBtn}`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {actionIcon && <span>{actionIcon}</span>}
                          {actionText}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </Motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Dialog;
