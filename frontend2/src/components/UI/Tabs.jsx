"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";
import gsap from "gsap";

// Compound Tabs component
const Tabs = ({
  tabs,
  className,
  listClassName,
  contentClassName,
  defaultValue = tabs[0]?.value,
  variant = "default",
  ...props
}) => {
  const contentRefs = React.useRef(new Map());

  // Handle GSAP animation on tab change
  React.useEffect(() => {
    const animateContent = (value) => {
      const activeContent = contentRefs.current.get(value);
      if (activeContent) {
        gsap.fromTo(
          activeContent,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        );
      }
    };

    if (defaultValue) {
      animateContent(defaultValue);
    }
  }, [defaultValue]);

  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      defaultValue={defaultValue}
      onValueChange={(value) => {
        gsap.to(Array.from(contentRefs.current.values()), {
          opacity: 0,
          y: 20,
          duration: 0.3,
          ease: "power2.in",
        });
        const activeContent = contentRefs.current.get(value);
        if (activeContent) {
          gsap.fromTo(
            activeContent,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.3 }
          );
        }
      }}
      {...props}
    >
      <TabsList variant={variant} className={listClassName}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            onClick={tab.onClick}
            className="flex-1"
            variant={variant}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={contentClassName}
          ref={(el) => {
            if (el) contentRefs.current.set(tab.value, el);
            else contentRefs.current.delete(tab.value);
          }}
        >
          {tab.content}
        </TabsContent>
      ))}
    </TabsPrimitive.Root>
  );
};

// TabsList component
const TabsList = React.forwardRef(({ className, variant, ...props }, ref) => {
  const baseStyles = "inline-flex w-full items-center justify-start gap-2 p-1";
  const variantStyles = {
    default: "bg-white border-b border-gray-200",
    underline: "bg-transparent border-b-2 border-gray-200",
    pill: "rounded-full",
  };

  return (
    <TabsPrimitive.List
      ref={ref}
      data-slot="tabs-list"
      className={cn(baseStyles, variantStyles[variant] || variantStyles.default, className)}
      {...props}
    />
  );
});
TabsList.displayName = "TabsList";

// TabsTrigger component
const TabsTrigger = React.forwardRef(({ className, onClick, variant, ...props }, ref) => {
  const baseStyles =
    "relative text-gray-600 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:mr-2";

  const variantStyles = {
    default: cn(
      "hover:bg-gray-100",
      "data-[state=active]:text-blue-600",
      "data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:w-full data-[state=active]:after:h-1 data-[state=active]:after:bg-blue-600"
    ),
    underline: cn(
      "hover:text-blue-500",
      "data-[state=active]:text-blue-600",
      "data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-2px] data-[state=active]:after:left-0 data-[state=active]:after:w-full data-[state=active]:after:h-1.5 data-[state=active]:after:bg-blue-600"
    ),
    pill: cn(
      "rounded-full hover:bg-gray-100",
      "data-[state=active]:bg-blue-100",
      "data-[state=active]:text-blue-600"
    ),
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      data-slot="tabs-trigger"
      className={cn(baseStyles, variantStyles[variant] || variantStyles.default, className)}
      onClick={(e) => {
        if (onClick) onClick();
        if (props.onClick) props.onClick(e);
      }}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

// TabsContent component
const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn("flex-1 outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };