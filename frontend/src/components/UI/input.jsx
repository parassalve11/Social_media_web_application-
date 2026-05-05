"use client";


import { forwardRef } from "react";
import { cn } from "../../lib/utils"; 
const Input = forwardRef(
  ({ className, type = "text", leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <span
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 flex h-full w-10 items-center justify-center bg-white text-gray-600 transition-colors hover:text-gold-600 border-r border-gold-200/50"
            )}
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={type}
          data-slot="input"
          className={cn(
            "flex h-10 w-full rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 transition-all duration-200",
            leftIcon ? "pl-12" : "pl-4",
            rightIcon ? "pr-10" : "pr-4",
            error ? "border-red-500 focus-visible:ring-red-500/50" : "",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "text-sm font-medium shadow-sm",
            "selection:bg-gold-100/50 selection:text-gray-900 focus-visible:shadow-md",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 transition-colors hover:text-gold-600">
            {rightIcon}
          </span>
        )}
        {error && (
          <span className="mt-1 block text-sm text-red-500 font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
