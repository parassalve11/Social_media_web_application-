"use client";

import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import Logo from "../UI/Logo";
import { useSidebar } from "../UI/sidebar/context";

export default function SidebarBrand() {
  const { isOpen } = useSidebar();
  const sizeClass = isOpen
    ? "h-16 md:h-24 w-auto max-w-[300px]"
    : "h-10 w-10";
  const wrapperClass = isOpen
    ? "w-full justify-center "
    : "p-1";

  return (
    <Link to="/" aria-label="Go to home" className="inline-flex w-full">
      <Motion.div
        whileHover={{ scale: 1.02 }}
        className={`flex items-center ${wrapperClass}`}
      >
        <Logo alt="Sangya logo" className={sizeClass} />
      </Motion.div>
    </Link>
  );
}
