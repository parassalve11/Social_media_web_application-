"use client";

// frontend/src/components/message/status/StatusBar.jsx
import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import StatusRing from "./StatusRing";
import StatusViewer from "./StatusViewer";
import CreateStatusModal from "./CreateStatusModal";
import { useStatus } from "../../../store/status/useStatus";
import { useToast } from "../../UI/ToastManager";

export default function StatusBar({ currentUser }) {
  const { grouped, isLoading, createStatus, isCreating, viewStatus, deleteStatus } =
    useStatus(currentUser?._id);

  const [viewerOpen, setViewerOpen]   = useState(false);
  const [viewerStart, setViewerStart] = useState(0);
  const [createOpen, setCreateOpen]   = useState(false);
  const { addToast }                  = useToast();

  /* split own statuses vs others */
  const ownGroup = grouped.find(
    (g) => String(g.user?._id ?? g.user) === String(currentUser?._id)
  );
  const othersGroups = grouped.filter(
    (g) => String(g.user?._id ?? g.user) !== String(currentUser?._id)
  );

  /* all groups in viewer order: own first, then others */
  const allGroups = ownGroup ? [ownGroup, ...othersGroups] : othersGroups;

  const openViewer = (groupIndex) => {
    setViewerStart(groupIndex);
    setViewerOpen(true);
  };

  const handleOwnClick = () => {
    if (ownGroup) {
      /* open viewer for own statuses */
      openViewer(0);
    } else {
      /* no status yet → open create modal */
      setCreateOpen(true);
    }
  };

  const handleDelete = async (statusId) => {
    try {
      await deleteStatus(statusId);
      addToast("Status deleted", { type: "success", duration: 2000 });
    } catch {
      addToast("Failed to delete status", { type: "error", duration: 3000 });
    }
  };

  const handleCreate = async (formData) => {
    try {
      await createStatus(formData);
      addToast("Status shared!", { type: "success", duration: 2500 });
    } catch {
      addToast("Failed to share status", { type: "error", duration: 3000 });
    }
  };

  return (
    <>
      {/* ═══ STATUS ROW ═══ */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-0.5 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>

          {/* ── OWN SLOT ── */}
          <StatusRing
            user={currentUser}
            isOwn
            hasUnseen={ownGroup?.hasUnseen ?? false}
            isEmpty={!ownGroup}
            onClick={handleOwnClick}
          />

          {/* ── SEPARATOR ── */}
          {othersGroups.length > 0 && (
            <div className="w-px h-10 bg-gray-200 mx-1 flex-shrink-0" />
          )}

          {/* ── OTHERS ── */}
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5"
                  style={{ width: 74 }}
                >
                  <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse" />
                  <div className="w-10 h-2 rounded bg-gray-200 animate-pulse" />
                </div>
              ))
            : othersGroups.map((g, i) => {
                /* index in allGroups: own is 0, others start at 1 */
                const viewerIdx = ownGroup ? i + 1 : i;
                return (
                  <StatusRing
                    key={g.user?._id ?? i}
                    user={g.user}
                    hasUnseen={g.hasUnseen}
                    onClick={() => openViewer(viewerIdx)}
                  />
                );
              })}

          {/* ── ADD MORE (if own exists) ── */}
          {ownGroup && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 px-2 focus:outline-none"
              title="Add new status"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-50 to-purple-50
                border-2 border-dashed border-blue-300 flex items-center justify-center
                hover:border-blue-500 hover:bg-blue-50 transition-all duration-200">
                <span className="text-2xl text-blue-400 leading-none font-light">+</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Add more</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ STORY VIEWER ═══ */}
      <AnimatePresence>
        {viewerOpen && allGroups.length > 0 && (
          <StatusViewer
            groups={allGroups}
            startGroupIndex={viewerStart}
            currentUserId={currentUser?._id}
            onClose={() => setViewerOpen(false)}
            onView={viewStatus}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      {/* ═══ CREATE MODAL ═══ */}
      <AnimatePresence>
        {createOpen && (
          <CreateStatusModal
            currentUser={currentUser}
            isCreating={isCreating}
            onClose={() => setCreateOpen(false)}
            onSubmit={handleCreate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
