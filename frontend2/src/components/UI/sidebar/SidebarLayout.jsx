"use client";

import React from "react";
import { useSidebar } from "./context";
import { BetterSidebar } from "./index";

const SidebarLayout = ({ children, menuItems, logo, footer, className, ...props }) => {
  const ContentWithSidebar = ({ children }) => {
    const { width, isMobile } = useSidebar();
    const marginLeft = isMobile ? 0 : width;
    const mobileBottomPadding = isMobile
      ? "calc(88px + env(safe-area-inset-bottom, 0px))"
      : undefined;

    return (
      <div className="flex w-screen">
        <BetterSidebar
          menuItems={menuItems}
          logo={logo}
          footer={footer}
          className={`shadow-md ${className}`}
          {...props}
        />
        <main
          className="flex-1 p-4 md:p-6 overflow-y-auto bg-white transition-all duration-300"
          style={{ marginLeft: `${marginLeft}px`, paddingBottom: mobileBottomPadding }}
        >
          {children}
        </main>
      </div>
    );
  };

  return <ContentWithSidebar>{children}</ContentWithSidebar>;
};

export default SidebarLayout;
