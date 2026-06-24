// ============================================================================
// FilterControls.jsx — Status & Sort Ribbon (v3: Search Bar Integration)
// ============================================================================
// Renders the controls ribbon: mobile hamburger, search input, status/sort
// dropdowns, and a primary "Add Task" button.
//
// Props contract:
//   searchTerm       — Current search query string
//   setSearchTerm    — Callback to update the search query
//   statusFilter     — Current status filter value ("All" | "Pending" | …)
//   setStatusFilter  — Callback to update the status filter
//   sortBy           — Current sort key ("due_date" | "priority")
//   setSortBy        — Callback to update the sort key
//   onOpenAddTask    — Callback to open the task creation modal
//   onToggleSidebar  — Callback to toggle the mobile sidebar drawer
// ============================================================================
import React from "react";

export default function FilterControls({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  onOpenAddTask,
  onToggleSidebar,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {/* ── Mobile-only hamburger menu button ──
          Visible only below md breakpoint. Triggers sidebar drawer open. */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden text-slate-400 hover:text-slate-100 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 transition font-bold text-base"
        title="Open navigation"
      >
        ≡
      </button>

      {/* ── Search input ──
          Full-width on mobile (via flex-wrap), inline on desktop. */}
      <input
        type="text"
        placeholder="🔍 Search tasks by title or note..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full sm:w-52 md:w-56 lg:w-64 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition order-last sm:order-none"
      />

      {/* ── Status filter dropdown ── */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 transition"
      >
        <option value="All">All Statuses</option>
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>

      {/* ── Sort order dropdown ── */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-blue-500 transition"
      >
        <option value="due_date">Sort by Deadline</option>
        <option value="priority">Sort by Urgency</option>
      </select>

      {/* ── Add Task button ── */}
      <button
        onClick={onOpenAddTask}
        className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl shadow-md transition whitespace-nowrap ml-auto"
      >
        + Add Task
      </button>
    </div>
  );
}
