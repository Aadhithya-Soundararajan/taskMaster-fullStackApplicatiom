// ============================================================================
// TaskItem.jsx — Single Task Row (v4: Time-Aware + Schedule + Case-Normalized)
// ============================================================================
// Renders one task entry: clickable status badge (3-stage cycle), title with
// strike-through on completion, priority badge (case-normalized), domain tag,
// overdue alert, schedule label (one-time with time vs recurring), description
// excerpt, due date/time, edit button, and delete button.
//
// ARCHITECTURE NOTE (v4):
//   - Priority strings are normalized via .toLowerCase() before color lookup
//   - Schedule labels display recurring patterns (🔁 Every Day / Mon, Wed, Fri)
//   - One-time tasks show precise deadline with time component when available
//   - Time-aware "Due at HH:MM" / "Today at HH:MM" / "Tomorrow at HH:MM"
//
// Props contract:
//   task             — The individual task object to render
//   domain           — The resolved domain object (or undefined for Inbox)
//   onToggleStatus   — Callback(taskId) to cycle status: Pending→InProgress→Completed→Pending
//   onOpenEditModal  — Callback(task) to open the edit modal pre-populated
//   onDeleteTask     — Callback(taskId) to remove the task
// ============================================================================
import React from "react";

// Priority → Tailwind class mapping (keyed by LOWERCASE for case normalization)
const PRIORITY_STYLES = {
  high:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low:    "bg-slate-500/10 text-slate-400 border-slate-500/20",
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

// Helper to normalize backend status string (e.g. "IN_PROGRESS" -> "In Progress")
function getDisplayStatus(rawStatus) {
  if (rawStatus === "PENDING") return "Pending";
  if (rawStatus === "IN_PROGRESS") return "In Progress";
  if (rawStatus === "COMPLETED") return "Completed";
  return rawStatus || "Pending";
}

/**
 * formatRecurrenceDays — Converts raw DB string like "MON,WED,FRI"
 * into readable sentence-cased form like "Mon, Wed, Fri"
 */
function formatRecurrenceDays(raw) {
  if (!raw) return "";
  return raw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
    .join(", ");
}

/**
 * formatTimeComponent — Extracts a human-readable time string from a Date.
 * Returns "" if the time is midnight-ish (likely no time was set).
 * Returns "at HH:MM AM/PM" if a meaningful time is present.
 */
function formatTimeComponent(dateObj) {
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  // If exactly midnight, consider no meaningful time set
  if (hours === 0 && minutes === 0) return "";
  // Format as 12-hour with AM/PM
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = String(minutes).padStart(2, "0");
  return ` at ${displayHours}:${displayMinutes} ${period}`;
}

export default function TaskItem({
  task,
  domain,
  onToggleStatus,
  onOpenEditModal,
  onDeleteTask,
}) {
  const displayStatus = getDisplayStatus(task.status);
  const isCompleted = displayStatus === "Completed";

  // ── Case-Normalized Priority Lookup ──
  // Apply .toLowerCase() before feeding to the color-token dictionary
  const normalizedPriority = (task.priority || "medium").toLowerCase();
  const priorityClass = PRIORITY_STYLES[normalizedPriority] || PRIORITY_STYLES.medium;

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
          STATUS_STYLES[displayStatus] || STATUS_STYLES.Pending
        }`}
        title={`Click to advance status (${displayStatus})`}
      >
        {STATUS_ICONS[displayStatus] || "○"} {displayStatus}
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

          {/* Priority badge (case-normalized) */}
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityClass}`}
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

          {/* ── Recurring Task Type Badge ── */}
          {task.taskType === "RECURRING" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20 flex items-center gap-1">
              🔁 Routine
            </span>
          )}

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

        {/* Metadata footer: schedule-aware labeling */}
        <div className="flex items-center gap-4 text-[10px] font-medium">
          {/* ── Schedule Label ── */}
          {(() => {
            // RECURRING task: show loop icon with frequency details
            if (task.taskType === "RECURRING") {
              if (task.frequency === "DAILY") {
                return (
                  <span className="text-violet-400 flex items-center gap-1">
                    🔁 Every Day
                  </span>
                );
              }
              if (task.frequency === "CUSTOM") {
                return (
                  <span className="text-violet-400 flex items-center gap-1">
                    🔁 {formatRecurrenceDays(task.recurrenceDays)}
                  </span>
                );
              }
              // Fallback for recurring with unknown frequency
              return (
                <span className="text-violet-400 flex items-center gap-1">
                  🔁 Recurring
                </span>
              );
            }

            // ONETIME task (default): show the calendar deadline countdown with time
            if (task.due_date === null) {
              return <span className="text-slate-500">📅 No Deadline</span>;
            }

            const now = new Date();
            const due = new Date(task.due_date);
            const timeSuffix = formatTimeComponent(due);

            // Normalize both dates to midnight for day-level comparison
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
            const diffMs = dueStart - todayStart;
            const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              // Past due
              return (
                <span className="text-red-400">
                  📅 {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? "day" : "days"} ago{timeSuffix}
                </span>
              );
            }
            if (diffDays === 0) {
              return (
                <span className="text-amber-400">📅 Today{timeSuffix}</span>
              );
            }
            if (diffDays === 1) {
              return (
                <span className="text-blue-400">📅 Tomorrow{timeSuffix}</span>
              );
            }
            // Future: more than 1 day away
            return (
              <span className="text-slate-400">📅 In {diffDays} days{timeSuffix}</span>
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
