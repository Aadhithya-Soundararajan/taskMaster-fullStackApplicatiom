// ============================================================================
// TaskForm.jsx — Polymorphic Modal Dialog (v2: Create / Edit Modes)
// ============================================================================
// A modal overlay dialog that serves dual purpose:
//   • CREATE mode (taskToEdit is null): Empty form, header "Create New Task"
//   • EDIT mode (taskToEdit is object): Pre-populated, header "Modify Task Details"
//
// Context-aware domain dropdown: hidden when selectedDomainId is active and
// the form is in CREATE mode (auto-inherits sidebar domain).
//
// Props contract:
//   isOpen           — Boolean controlling modal visibility
//   onClose          — Callback to close the modal
//   onSubmit         — Callback(formFields) receiving the form payload
//   domains          — Array of domain objects for the dropdown
//   selectedDomainId — Currently active sidebar filter (null = "All Tasks")
//   taskToEdit       — Existing task object (edit mode) or null (create mode)
// ============================================================================
import React, { useState, useEffect } from "react";

export default function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  domains,
  selectedDomainId,
  taskToEdit,
}) {
  // ── Local form state ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [formDomainId, setFormDomainId] = useState("");

  // ── Derive mode from props ──
  const isEditMode = taskToEdit !== null && taskToEdit !== undefined;

  // ── Sync local state when modal opens or taskToEdit changes ──
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode) {
      // EDIT mode: Pre-populate all fields from the existing task
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setPriority(taskToEdit.priority || "Medium");
      // Convert ISO date to YYYY-MM-DD for the native date input
      setDueDate(
        taskToEdit.due_date
          ? new Date(taskToEdit.due_date).toISOString().split("T")[0]
          : ""
      );
      setFormDomainId(
        taskToEdit.domain_id !== null && taskToEdit.domain_id !== undefined
          ? String(taskToEdit.domain_id)
          : ""
      );
    } else {
      // CREATE mode: Reset all fields to defaults
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDate("");
      setFormDomainId("");
    }
  }, [isOpen, taskToEdit, isEditMode]);

  // Resolve the human-readable name for the current sidebar domain
  const currentDomainName =
    domains.find((d) => d.id === selectedDomainId)?.name ?? null;

  // ── Determine whether to show the domain dropdown ──
  // In CREATE mode with an active sidebar domain → hide dropdown (auto-inherit).
  // In EDIT mode → always show dropdown so users can reassign.
  // In CREATE mode with "All Tasks" (null) → show dropdown.
  const showDomainDropdown =
    isEditMode || selectedDomainId === null;

  /**
   * handleSubmit — Constructs the payload and delegates to parent.
   * Strict parsing: empty date → null (not a default 2-day offset).
   */
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      // Strict null parsing: empty date picker → null
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      // Domain resolution:
      // Edit mode: use dropdown value (could be "" → null for Inbox)
      // Create mode with active sidebar domain: inherit it directly
      // Create mode "All Tasks": use dropdown value
      domain_id: showDomainDropdown
        ? (formDomainId ? Number(formDomainId) : null)
        : selectedDomainId,
    };

    onSubmit(payload);
    onClose();
  };

  // ── Don't render anything when closed ──
  if (!isOpen) return null;

  return (
    // ── Backdrop Overlay ──
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* ── Modal Panel ── */}
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            {isEditMode ? "Modify Task Details" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 text-lg transition p-1 rounded-lg hover:bg-slate-800"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Modal Body (Form) ── */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              placeholder={
                !isEditMode && selectedDomainId !== null
                  ? `Add a task directly into ${currentDomainName}...`
                  : "Task description title..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 text-slate-100"
            />
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Optional description note context details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 text-slate-100 resize-none"
            />
          </div>

          {/* Row: Due Date + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">⚪ Low</option>
              </select>
            </div>
          </div>

          {/* ── Context-Aware Domain Dropdown ──
              Shown in edit mode (always) or create mode when no sidebar domain. */}
          {showDomainDropdown && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Workspace
              </label>
              {/* Domain dropdown with emoji-enriched options and color-tinted border */}
              <select
                value={formDomainId}
                onChange={(e) => setFormDomainId(e.target.value)}
                className="w-full bg-slate-950 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none"
                style={{
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: formDomainId
                    ? (domains.find((d) => String(d.id) === formDomainId)?.color_code || "#334155") + "60"
                    : "#334155",
                }}
              >
                <option value="">📥 Inbox / Uncategorized</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.emoji || "📂"} {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Modal Footer ── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-md transition whitespace-nowrap"
            >
              {isEditMode ? "Save Changes" : "+ Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
