// ============================================================================
// TaskItem.jsx — Single Task Row (v2: 3-Stage Status Cycling & Edit Mode)
// ============================================================================
// Renders one task entry: clickable status badge (3-stage cycle), title with
// strike-through on completion, priority badge, domain tag, overdue alert,
// description excerpt, due date, edit button, and delete button.
//
// Props contract:
//   task             — The individual task object to render
//   domain           — The resolved domain object (or undefined for Inbox)
//   onToggleStatus   — Callback(taskId) to cycle status: Pending→InProgress→Completed→Pending
//   onOpenEditModal  — Callback(task) to open the edit modal pre-populated
//   onDeleteTask     — Callback(taskId) to remove the task
// ============================================================================
import React from "react";

// Priority → Tailwind class mapping (kept component-local for encapsulation)
const PRIORITY_STYLES = {
  High:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low:    "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

// Status → visual style mapping for the clickable status badge
const STATUS_STYLES = {
  Pending:       "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20",
  "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
  Completed:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
};

// Status → emoji indicator for the badge
const STATUS_ICONS = {
  Pending:       "○",
  "In Progress": "◑",
  Completed:     "●",
};

export default function TaskItem({
  task,
  domain,
  onToggleStatus,
  onOpenEditModal,
  onDeleteTask,
}) {
  const isCompleted = task.status === "Completed";

  // ── Overdue Detection ──
  // A task is overdue if it's NOT completed, has a due_date, and that date is in the past.
  const isOverdue =
    !isCompleted &&
    task.due_date !== null &&
    new Date(task.due_date) < new Date();

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-4 transition hover:border-slate-700 shadow-sm ${
        isCompleted ? "opacity-40" : ""
      }`}
    >
      {/* ── Clickable Status Badge (replaces checkbox) ──
          Cycles: Pending → In Progress → Completed → Pending */}
      <button
        onClick={() => onToggleStatus(task.id)}
        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer transition mt-0.5 shrink-0 ${
          STATUS_STYLES[task.status]
        }`}
        title={`Click to advance status (${task.status})`}
      >
        {STATUS_ICONS[task.status]} {task.status}
      </button>

      {/* ── Task Body ── */}
      <div className="flex-1 min-w-0">
        {/* Title row with inline badges */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3
            className={`text-sm font-semibold tracking-wide truncate ${
              isCompleted
                ? "line-through text-slate-500"
                : "text-slate-100"
            }`}
          >
            {task.title}
          </h3>

          {/* Priority badge */}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              PRIORITY_STYLES[task.priority]
            }`}
          >
            {task.priority}
          </span>

          {/* Domain tag with emoji & color-tinted border */}
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{
              backgroundColor: domain ? `${domain.color_code}12` : "rgba(100,116,139,0.08)",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: domain ? `${domain.color_code}40` : "#334155",
              color: domain ? domain.color_code : "#94a3b8",
            }}
          >
            <span className="text-xs leading-none">{domain ? (domain.emoji || "📂") : "📥"}</span>
            {domain ? domain.name : "Inbox"}
          </span>

          {/* ── Overdue Warning Badge ── */}
          {isOverdue && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/30 animate-pulse">
              ⚠️ Overdue
            </span>
          )}
        </div>

        {/* Optional description excerpt (clamped to 2 lines) */}
        {task.description && (
          <p className={`text-xs line-clamp-2 leading-relaxed mb-2 ${
            isCompleted ? "text-slate-600" : "text-slate-400"
          }`}>
            {task.description}
          </p>
        )}

        {/* Metadata footer: smart relative due date badge */}
        <div className="flex items-center gap-4 text-[10px] font-medium">
          {(() => {
            // ── Smart Relative Date Helper ──
            // Computes a human-friendly label relative to the current system date.
            if (task.due_date === null) {
              return <span className="text-slate-500">📅 No Deadline</span>;
            }

            const now = new Date();
            const due = new Date(task.due_date);

            // Normalize both dates to midnight for day-level comparison
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
            const diffMs = dueStart - todayStart;
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              // Past due — overdue badge only shown for non-completed tasks
              // (the main Overdue badge handles the alert; this shows the date context)
              return (
                <span className="text-red-400">
                  📅 {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? "day" : "days"} ago
                </span>
              );
            }
            if (diffDays === 0) {
              return (
                <span className="text-amber-400">📅 Today</span>
              );
            }
            if (diffDays === 1) {
              return (
                <span className="text-blue-400">📅 Tomorrow</span>
              );
            }
            // Future: more than 1 day away
            return (
              <span className="text-slate-400">📅 In {diffDays} days</span>
            );
          })()}
        </div>
      </div>

      {/* ── Action Buttons (Edit + Delete) ── */}
      <div className="flex items-center gap-1 shrink-0 self-center">
        {/* Edit button */}
        <button
          onClick={() => onOpenEditModal(task)}
          className="text-slate-500 hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-950/50 transition text-sm"
          title="Edit task"
        >
          ✎
        </button>

        {/* Delete button */}
        <button
          onClick={() => onDeleteTask(task.id)}
          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-950/50 transition text-sm"
          title="Delete permanently"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
