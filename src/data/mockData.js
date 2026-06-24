// ============================================================================
// mockData.js — Centralized Data Layer
// ============================================================================
// Single source of truth for all seed data used across the application.
// Each entity follows the schema contract expected by the backend API,
// making future migration to real endpoints a drop-in replacement.
// ============================================================================

/**
 * Domain workspaces — logical groupings for task categorization.
 * @type {Array<{id: number, name: string, color_code: string, emoji: string}>}
 */
export const mockDomains = [
  { id: 1, name: "Academic",  color_code: "#3498db", emoji: "🎓" },
  { id: 2, name: "Personal",  color_code: "#e67e22", emoji: "🏃‍♂️" },
  { id: 3, name: "Career",    color_code: "#2ecc71", emoji: "💼" },
];

/**
 * Task entries — each task carries a reference to its parent domain via domain_id.
 * A null domain_id means the task lives in "Inbox / Uncategorized".
 * @type {Array<{
 *   id: number,
 *   user_id: number,
 *   title: string,
 *   description: string,
 *   status: "Pending" | "In Progress" | "Completed",
 *   priority: "High" | "Medium" | "Low",
 *   domain_id: number | null,
 *   due_date: string,
 *   created_at: string,
 *   updated_at: string,
 *   completed_at: string | null
 * }>}
 */
export const mockTasks = [
  {
    id: 101,
    user_id: 1,
    title: "Finish DSA Assignment",
    description:
      "Complete the graph theory implementation problems and submit on the student portal.",
    status: "Pending",
    priority: "High",
    domain_id: 1,
    due_date: "2026-06-23T23:59:59Z",
    created_at: "2026-06-22T10:00:00Z",
    updated_at: "2026-06-22T14:30:00Z",
    completed_at: null,
  },
  {
    id: 102,
    user_id: 1,
    title: "Go to the gym",
    description: "Leg day workout routine.",
    status: "Completed",
    priority: "Medium",
    domain_id: 2,
    due_date: "2026-06-22T20:00:00Z",
    created_at: "2026-06-21T09:00:00Z",
    updated_at: "2026-06-22T21:15:00Z",
    completed_at: "2026-06-22T21:15:00Z",
  },
  {
    id: 103,
    user_id: 1,
    title: "Revamp technical resume",
    description:
      "Add recent full-stack projects and prepare for upcoming internship applications.",
    status: "In Progress",
    priority: "High",
    domain_id: 3,
    due_date: "2026-06-25T18:00:00Z",
    created_at: "2026-06-22T11:00:00Z",
    updated_at: "2026-06-22T16:00:00Z",
    completed_at: null,
  },
  {
    id: 104,
    user_id: 1,
    title: "Buy groceries",
    description: "Need eggs, milk, bread, and chicken breasts.",
    status: "Pending",
    priority: "Low",
    domain_id: null, // Inbox / Uncategorized
    due_date: "2026-06-26T23:59:59Z",
    created_at: "2026-06-22T15:20:00Z",
    updated_at: "2026-06-22T15:20:00Z",
    completed_at: null,
  },
];
