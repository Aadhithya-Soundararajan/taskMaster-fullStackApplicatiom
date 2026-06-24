// ============================================================================
// TaskList.jsx — Task Collection Renderer (v2: Prop Propagation)
// ============================================================================
// Iterates over the (already filtered + sorted) tasks array and delegates
// rendering of each item to <TaskItem />. Also handles the empty-state UI
// when no tasks match the current filters.
//
// Props contract:
//   tasks            — Pre-filtered & sorted array of task objects
//   domains          — Full domains array (for resolving domain metadata)
//   onToggleStatus   — Callback(taskId) forwarded to each TaskItem
//   onOpenEditModal  — Callback(task) forwarded to each TaskItem
//   onDeleteTask     — Callback(taskId) forwarded to each TaskItem
// ============================================================================
import React from "react";
import TaskItem from "./TaskItem";

export default function TaskList({
  tasks,
  domains,
  onToggleStatus,
  onOpenEditModal,
  onDeleteTask,
}) {
  // ── Empty state ──
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
        <span className="text-3xl inline-block mb-2">🏝️</span>
        <p className="text-sm text-slate-400 font-medium">
          All clear! No pending database tasks found here.
        </p>
      </div>
    );
  }

  // ── Populated list ──
  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        // Resolve the domain object for this task (undefined = Inbox)
        const taskDomain = domains.find((d) => d.id === task.domain_id);

        return (
          <TaskItem
            key={task.id}
            task={task}
            domain={taskDomain}
            onToggleStatus={onToggleStatus}
            onOpenEditModal={onOpenEditModal}
            onDeleteTask={onDeleteTask}
          />
        );
      })}
    </div>
  );
}
