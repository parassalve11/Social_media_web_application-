"use client";

// components/Layout/Layout.jsx
import {
  Bell,
  Bookmark,
  Home,
  MessageSquare,
  Search,
  Settings,
  User,
  Shield,
  Zap,
  Clapperboard,
} from "lucide-react";
import SidebarLayout from "../UI/sidebar/SidebarLayout";
import { SidebarProvider } from "../UI/sidebar/context";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../lib/axiosIntance";
import { useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";

function Layout({ children }) {
  const location = useLocation();

  const { data: unreadCount, isLoading, error } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      const response = await axiosInstance.get("/notifications/unread-count");
      return response.data.count;
    },
    refetchInterval: 30000,
  });

  const menuItems = [
    {
      label: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />,
      activeColor: "text-blue-600",
    },
    {
      label: "Messages & Status",
      href: "/messages",
      icon: <MessageSquare className="h-5 w-5" />,
      activeColor: "text-green-600",
    },
    {
      // ── NEW: Reels tab ──
      label: "Reels",
      href: "/reels",
      icon: <Clapperboard className="h-5 w-5" />,
      activeColor: "text-pink-600",
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      count: isLoading || error ? 0 : unreadCount || 0,
      activeColor: "text-red-600",
    },
    {
      label: "Bookmarks",
      href: "/bookmarks",
      icon: <Bookmark className="h-5 w-5" />,
      activeColor: "text-amber-600",
    },
    {
      label: "Search",
      href: "/search",
      icon: <Search className="h-5 w-5" />,
      activeColor: "text-purple-600",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      activeColor: "text-gray-600",
      subItems: [
        { label: "Profile",  href: "/settings/profile",  icon: <User className="h-4 w-4" /> },
        { label: "Account",  href: "/settings/account",  icon: <Settings className="h-4 w-4" /> },
        { label: "Privacy",  href: "/settings/privacy",  icon: <Shield className="h-4 w-4" /> },
        { label: "Security", href: "/settings/security", icon: <Shield className="h-4 w-4" /> },
      ],
    },
  ];

  // Routes where the sidebar should be hidden
  const hideSidebarRoutes = [
    "/signup",
    "/signin",
    "/messages",
    "/reels",           // ← full-screen, hide sidebar
    "/forgot-password",
    "/check-inbox",
    "/verify-email",
    "/reset-password",
  ];

  const shouldHideSidebar = hideSidebarRoutes.includes(location.pathname);

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-visible">
      <AnimatePresence mode="wait">
        {shouldHideSidebar ? (
          <Motion.main
            key="no-sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen"
          >
            {children}
          </Motion.main>
        ) : (
          <Motion.div
            key="with-sidebar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SidebarLayout
              menuItems={menuItems}
              logo={null}
              footer={
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-center gap-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <Motion.a whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.9 }}
                      href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-500 transition-colors" aria-label="Twitter">
                      <FaTwitter className="h-5 w-5" />
                    </Motion.a>
                    <Motion.a whileHover={{ scale: 1.2, rotate: -5 }} whileTap={{ scale: 0.9 }}
                      href="https://github.com" target="_blank" rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="GitHub">
                      <FaGithub className="h-5 w-5" />
                    </Motion.a>
                    <Motion.a whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.9 }}
                      href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                      className="text-gray-600 hover:text-blue-700 transition-colors" aria-label="LinkedIn">
                      <FaLinkedin className="h-5 w-5" />
                    </Motion.a>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-gray-500 font-medium">© 2025 MyApp</p>
                    <p className="text-xs text-gray-400">Made with ❤️ for the community</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <a href="/privacy" className="text-gray-500 hover:text-blue-600 transition-colors">Privacy</a>
                    <span className="text-gray-300">·</span>
                    <a href="/terms" className="text-gray-500 hover:text-blue-600 transition-colors">Terms</a>
                    <span className="text-gray-300">·</span>
                    <a href="/help" className="text-gray-500 hover:text-blue-600 transition-colors">Help</a>
                  </div>
                </div>
              }
            >
              <main className="h-screen overflow-y-auto">
                <Motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {children}
                </Motion.div>
              </main>
            </SidebarLayout>
          </Motion.div>
        )}
      </AnimatePresence>
      </div>
    </SidebarProvider>
  );
}

export default Layout;

