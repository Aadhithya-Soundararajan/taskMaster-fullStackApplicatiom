// ============================================================================
// TaskForm.jsx — Polymorphic Modal Dialog (v4: DateTime-Local + Schedule-Aware)
// ============================================================================
// A modal overlay dialog that serves dual purpose:
//   • CREATE mode (taskToEdit is null): Empty form, header "Create New Task"
//   • EDIT mode (taskToEdit is object): Pre-populated, header "Modify Task Details"
//
// ARCHITECTURE NOTE (v4):
//   - Upgraded one-time deadline input from type="date" to type="datetime-local"
//     for precise time-of-day capture and end-of-day deadline intelligence
//   - When no time is specified on create, defaults to end-of-day (23:59)
//   - Edit mode pre-populates datetime-local from ISO strings with proper format
//   - Added taskType segmented toggle: "One-Time Assignment" vs "Recurring Routine"
//   - One-Time shows the datetime-local picker; Recurring hides it and shows frequency
//   - Custom Days mode shows 7 interactive checkbox buttons (MON–SUN)
//   - Submission payload includes taskType, frequency, and recurrenceDays
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

// Day definitions for the custom recurrence checkbox row
const WEEKDAYS = [
  { key: "MON", label: "Mon" },
  { key: "TUE", label: "Tue" },
  { key: "WED", label: "Wed" },
  { key: "THU", label: "Thu" },
  { key: "FRI", label: "Fri" },
  { key: "SAT", label: "Sat" },
  { key: "SUN", label: "Sun" },
];

/**
 * toDateTimeLocalString — Converts an ISO date string or Date object
 * into the "YYYY-MM-DDTHH:MM" format required by <input type="datetime-local">
 */
function toDateTimeLocalString(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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
  const [dueDateTime, setDueDateTime] = useState(""); // Now stores "YYYY-MM-DDTHH:MM"
  const [formDomainId, setFormDomainId] = useState("");

  // ── Schedule state ──
  const [taskType, setTaskType] = useState("ONETIME"); // "ONETIME" | "RECURRING"
  const [frequency, setFrequency] = useState("DAILY"); // "DAILY" | "CUSTOM"
  const [selectedDays, setSelectedDays] = useState([]); // e.g., ["MON", "WED", "FRI"]

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
      // Convert ISO date to datetime-local format (YYYY-MM-DDTHH:MM)
      setDueDateTime(toDateTimeLocalString(taskToEdit.due_date));
      setFormDomainId(
        taskToEdit.domain_id !== null && taskToEdit.domain_id !== undefined
          ? String(taskToEdit.domain_id)
          : ""
      );

      // Schedule fields
      setTaskType(taskToEdit.taskType || "ONETIME");
      setFrequency(taskToEdit.frequency || "DAILY");
      // Parse recurrenceDays string back into array
      if (taskToEdit.recurrenceDays) {
        setSelectedDays(
          taskToEdit.recurrenceDays
            .split(",")
            .map((d) => d.trim())
            .filter(Boolean)
        );
      } else {
        setSelectedDays([]);
      }
    } else {
      // CREATE mode: Reset all fields to defaults
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setDueDateTime("");
      setFormDomainId("");
      setTaskType("ONETIME");
      setFrequency("DAILY");
      setSelectedDays([]);
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
   * toggleDay — Adds or removes a day key from the selectedDays array
   */
  const toggleDay = (dayKey) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((d) => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  /**
   * handleSubmit — Constructs the payload including schedule fields and delegates to parent.
   * For datetime-local values, constructs a proper ISO string.
   * Fallback: if the user picks a date-only (no time component), default to 23:59 (end-of-day).
   */
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // ── Build due_date ISO string from datetime-local input ──
    let resolvedDueDate = null;
    if (taskType === "ONETIME" && dueDateTime) {
      const parsed = new Date(dueDateTime);
      if (!isNaN(parsed.getTime())) {
        // If time component is midnight (00:00) and user likely just picked a date,
        // bump to end-of-day 23:59 for smarter deadline intelligence
        if (parsed.getHours() === 0 && parsed.getMinutes() === 0) {
          parsed.setHours(23, 59, 0, 0);
        }
        resolvedDueDate = parsed.toISOString();
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      due_date: resolvedDueDate,
      // Domain resolution:
      // Edit mode: use dropdown value (could be "" → null for Inbox)
      // Create mode with active sidebar domain: inherit it directly
      // Create mode "All Tasks": use dropdown value
      domain_id: showDomainDropdown
        ? formDomainId
          ? Number(formDomainId)
          : null
        : selectedDomainId,
      // ── Schedule payload fields ──
      taskType: taskType,
      frequency: taskType === "RECURRING" ? frequency : null,
      recurrenceDays:
        taskType === "RECURRING" && frequency === "CUSTOM" && selectedDays.length > 0
          ? selectedDays.join(",")
          : null,
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
          {/* ── Task Type Segmented Toggle ── */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Task Type
            </label>
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 gap-1">
              <button
                type="button"
                onClick={() => setTaskType("ONETIME")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  taskType === "ONETIME"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                📋 One-Time Assignment
              </button>
              <button
                type="button"
                onClick={() => setTaskType("RECURRING")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  taskType === "RECURRING"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                🔁 Recurring Routine
              </button>
            </div>
          </div>

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

          {/* ── Schedule-Conditional Section ── */}
          {taskType === "ONETIME" ? (
            /* ONE-TIME: Due Date/Time + Priority row */
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={dueDateTime}
                  onChange={(e) => setDueDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
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
          ) : (
            /* RECURRING: Frequency + Priority + Custom Days */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-violet-500"
                  >
                    <option value="DAILY">🔄 Daily</option>
                    <option value="CUSTOM">🗓️ Custom Days</option>
                  </select>
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

              {/* ── Custom Days Checkbox Row ── */}
              {frequency === "CUSTOM" && (
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: frequency === "CUSTOM" ? "120px" : "0px" }}
                >
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Select Days
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {WEEKDAYS.map((day) => {
                      const isSelected = selectedDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${
                            isSelected
                              ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20"
                              : "bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDays.length > 0 && (
                    <p className="text-[10px] text-violet-400 mt-2 font-medium">
                      🔁 Repeats on: {selectedDays.map((d) => d.charAt(0) + d.slice(1).toLowerCase()).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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
              className={`font-medium text-xs px-5 py-2.5 rounded-xl shadow-md transition whitespace-nowrap text-white ${
                taskType === "RECURRING"
                  ? "bg-violet-600 hover:bg-violet-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {isEditMode ? "Save Changes" : taskType === "RECURRING" ? "🔁 Create Routine" : "+ Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
