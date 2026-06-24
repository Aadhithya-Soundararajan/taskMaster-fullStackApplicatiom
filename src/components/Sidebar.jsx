// ============================================================================
// Sidebar.jsx — Navigation & Domain Switcher (v4: Auth-Aware + Logout)
// ============================================================================
// Renders the left-rail panel containing the app brand, logged-in user info,
// "All Tasks" shortcut, per-domain navigation buttons with emoji icons and
// color-tinted active states, inline domain creation with emoji + color picker,
// and a logout button. On mobile, behaves as a slide-out overlay drawer.
//
// Props contract:
//   domains             — Array of domain objects ({ id, name, color_code, emoji })
//   tasks               — Full (unfiltered) tasks array, used only for counts
//   selectedDomainId    — Currently active domain filter (null = "All Tasks")
//   setSelectedDomainId — Callback to switch the active domain
//   isSidebarOpen       — Boolean controlling mobile drawer visibility
//   setIsSidebarOpen    — Callback to toggle the mobile drawer
//   onAddDomain         — Callback(name, emoji, colorHex) to create a new domain
//   currentUser         — The logged-in user object ({ id, username, email })
//   onLogout            — Callback() to sign out and flush all session state
// ============================================================================
import React, { useState } from "react";

export default function Sidebar({
  domains,
  tasks,
  selectedDomainId,
  setSelectedDomainId,
  isSidebarOpen,
  setIsSidebarOpen,
  onAddDomain,
  currentUser,
  onLogout,
}) {
  // ── Local state for inline domain creation form ──
  const [isCreating, setIsCreating] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainEmoji, setNewDomainEmoji] = useState("📂");
  const [newDomainColor, setNewDomainColor] = useState("#6366f1");

  /**
   * handleSaveDomain — Validates and submits the new domain with name,
   * emoji, and user-selected color, then resets the form.
   */
  const handleSaveDomain = () => {
    if (!newDomainName.trim()) return;
    onAddDomain(newDomainName.trim(), newDomainEmoji, newDomainColor);
    setNewDomainName("");
    setNewDomainEmoji("📂");
    setNewDomainColor("#6366f1");
    setIsCreating(false);
  };

  /**
   * handleCancelCreate — Resets the inline form without saving.
   */
  const handleCancelCreate = () => {
    setNewDomainName("");
    setNewDomainEmoji("📂");
    setNewDomainColor("#6366f1");
    setIsCreating(false);
  };

  /**
   * handleDomainSelect — Selects a domain and auto-closes sidebar on mobile.
   */
  const handleDomainSelect = (domainId) => {
    setSelectedDomainId(domainId);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* ── Backdrop overlay (mobile only, visible when drawer is open) ── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar Panel ──
          Desktop: always visible in the grid (col-span-1).
          Mobile: absolute overlay drawer, slides in/out via translate. */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72
          md:static md:w-auto md:z-auto
          col-span-1 bg-slate-900 border-r border-slate-800 p-6
          flex flex-col justify-between
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* ── Top section ── */}
        <div>
          {/* Brand Header + Mobile Close Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                TASKMASTER
              </h1>
            </div>

            {/* Close button — mobile only */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition"
              title="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* ── Logged-in User Identity ── */}
          {currentUser && (
            <div className="flex items-center gap-3 mb-6 px-2 py-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{currentUser.username}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
              </div>
            </div>
          )}

          {/* ── Section Label ── */}
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Dashboards
          </h2>

          {/* ── Navigation List ── */}
          <nav className="space-y-1">
            {/* "All Tasks" aggregate button */}
            <button
              onClick={() => handleDomainSelect(null)}
              className={`w-full text-left px-4 py-2.5 rounded-xl transition font-medium text-sm flex items-center justify-between ${
                selectedDomainId === null
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span>📁 All Tasks</span>
              <span className="text-xs bg-slate-950/40 px-2 py-0.5 rounded-md text-slate-400">
                {tasks.length}
              </span>
            </button>

            {/* ── Domain Sub-header ── */}
            <div className="pt-4 pb-2">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Domains
              </h2>
            </div>

            {/* ── Per-domain navigation buttons with emoji & color-tinted active state ── */}
            {domains.map((domain) => {
              const count = tasks.filter(
                (t) => t.domain_id === domain.id
              ).length;
              const isActive = selectedDomainId === domain.id;

              return (
                <button
                  key={domain.id}
                  onClick={() => handleDomainSelect(domain.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl transition font-medium text-sm flex items-center justify-between border ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200"
                  }`}
                  // Active state: faded domain color background + solid color border
                  style={
                    isActive
                      ? {
                          backgroundColor: `${domain.color_code}18`,
                          borderColor: domain.color_code,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2.5">
                    {/* Domain emoji (replaces color dot) */}
                    <span className="text-base leading-none">
                      {domain.emoji || "📂"}
                    </span>
                    {domain.name}
                  </div>
                  {/* Per-domain count badge */}
                  <span className="text-xs bg-slate-950/40 px-2 py-0.5 rounded-md text-slate-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Bottom: New Domain CTA or Expanded Creation Form ── */}
        {isCreating ? (
          <div className="mt-auto space-y-3">
            {/* Domain name input */}
            <input
              type="text"
              placeholder="Domain name..."
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveDomain();
                if (e.key === "Escape") handleCancelCreate();
              }}
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            {/* Row: Emoji input + Color picker */}
            <div className="flex gap-2">
              {/* Compact emoji text input */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="📂"
                  value={newDomainEmoji}
                  onChange={(e) => setNewDomainEmoji(e.target.value)}
                  maxLength={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-center text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  title="Paste or type an emoji symbol"
                />
              </div>

              {/* Native HTML color spectrum picker */}
              <label
                className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1 cursor-pointer hover:border-slate-500 transition"
                title="Pick a workspace theme color"
              >
                <input
                  type="color"
                  value={newDomainColor}
                  onChange={(e) => setNewDomainColor(e.target.value)}
                  className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded"
                />
                <span className="text-xs text-slate-400">Color</span>
              </label>
            </div>

            {/* Preview chip showing the domain as it will appear */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300"
              style={{ backgroundColor: `${newDomainColor}18`, border: `1px solid ${newDomainColor}40` }}
            >
              <span>{newDomainEmoji}</span>
              <span>{newDomainName || "Preview"}</span>
            </div>

            {/* Save / Cancel buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSaveDomain}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 rounded-lg transition"
              >
                Save
              </button>
              <button
                onClick={handleCancelCreate}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold py-1.5 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full mt-auto py-2 border border-dashed border-slate-700 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-300 hover:border-slate-500 transition"
          >
            + New Domain Workspace
          </button>
        )}

        {/* ── Logout Button (always visible at bottom) ── */}
        {currentUser && (
          <button
            onClick={onLogout}
            className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition flex items-center justify-center gap-2"
          >
            ⏻ Sign Out
          </button>
        )}
      </div>
    </>
  );
}
