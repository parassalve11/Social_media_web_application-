"use client";

//frontend\src\components\message\MessageLayout.jsx
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";



import { useMessageLayout } from "../../store/message/useMessageLayout"; 
import ChatWindow from "./chat/ChatWindow";

export default function MessagesLayout({ children }) {
  const { selectedContact, setSelectedContact } = useMessageLayout();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () =>
      setIsMobile(window.innerWidth < 768);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  return (
    <div className=" h-full  flex relative bg-gray-100">
      {/* {!isMobile && <MessageSidebar />} */}

      <div className={`flex-1 flex overflow-hidden ${isMobile && "flex-col"}`}>
        <AnimatePresence initial={false}>
          {(!selectedContact || !isMobile) && (
            <Motion.div
              key="chatList"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`w-full md:w-xl h-full ${isMobile && "pb-16"}`}
            >
              {children}
            </Motion.div>
          )}

          {(selectedContact || !isMobile) && (
            <Motion.div
              key="chatWindow"
              initial={{ x: isMobile ? "100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="w-full h-full"
            >
              <ChatWindow
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
              />
            </Motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* {isMobile && <MessagesLayout />} */}
    </div>
  );
}
