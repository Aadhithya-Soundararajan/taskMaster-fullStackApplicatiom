// ============================================================================
// App.jsx — Application Shell & State Orchestrator (v5 - Auth-Gated, User-Scoped)
// ============================================================================
import React, { useState, useEffect } from "react";

// UI components
import Sidebar from "./components/Sidebar";
import TaskForm from "./components/TaskForm";
import FilterControls from "./components/FilterControls";
import TaskList from "./components/TaskList";
import Login from "./components/Login";
import Signup from "./components/Signup";

// 3-stage status cycle order
const STATUS_CYCLE = ["Pending", "In Progress", "Completed"];
const BACKEND_URL = "http://localhost:8080/api";

function App() {
  // ──────────────────────────────────────────────────────────────────────
  // 1. Authentication State
  // ──────────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(() => {
    // Lazy initialization: restore session from localStorage on page refresh
    try {
      const stored = localStorage.getItem('task_manager_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [authView, setAuthView] = useState("login"); // "login" | "signup"

  // ──────────────────────────────────────────────────────────────────────
  // 2. Application Core State
  // ──────────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedDomainId, setSelectedDomainId] = useState(null); // null = "All Tasks"
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("due_date");
  const [searchTerm, setSearchTerm] = useState("");

  // ── UI control state ──
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null); // null = create mode, object = edit mode

  // ──────────────────────────────────────────────────────────────────────
  // 3. User-Scoped Data Hydration (watches currentUser.id)
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Guard: Only fetch when a validated user session exists
    if (!currentUser?.id) return;

    setLoading(true);

    Promise.all([
      fetch(`${BACKEND_URL}/tasks/user/${currentUser.id}`),
      fetch(`${BACKEND_URL}/domains/user/${currentUser.id}`)
    ])
      .then(async ([tasksRes, domainsRes]) => {
        if (!tasksRes.ok || !domainsRes.ok) throw new Error("Server communication failure");

        const rawTasks = await tasksRes.json();
        const rawDomains = await domainsRes.json();

        // Adapter 1: Map camelCase Java Domains to frontend snake_case
        const mappedDomains = rawDomains.map(d => ({
          id: d.id,
          name: d.name,
          emoji: d.emoji,
          color_code: d.colorCode
        }));

        // Adapter 2: Map Java Tasks to frontend layout & flatten relation structure
        const mappedTasks = rawTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          domain_id: t.domain ? t.domain.id : null,
          due_date: t.dueDate,
          created_at: t.createdAt,
          updated_at: t.updatedAt,
          completed_at: t.completedAt
        }));

        setDomains(mappedDomains);
        setTasks(mappedTasks);
      })
      .catch(err => {
        console.error("Failed to connect to full-stack backend pipeline:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUser?.id]);

  // ──────────────────────────────────────────────────────────────────────
  // 4. Auth Handlers
  // ──────────────────────────────────────────────────────────────────────
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('task_manager_user', JSON.stringify(user));
    setAuthView("login"); // Reset for next session
  };

  const handleLogout = () => {
    // Flush ALL state to prevent cross-account UI visual leaks
    localStorage.removeItem('task_manager_user');
    setCurrentUser(null);
    setTasks([]);
    setDomains([]);
    setSelectedDomainId(null);
    setStatusFilter("All");
    setSortBy("due_date");
    setSearchTerm("");
    setIsSidebarOpen(false);
    setIsModalOpen(false);
    setTaskToEdit(null);
  };

  // ──────────────────────────────────────────────────────────────────────
  // 5. Derived / Computed Values
  // ──────────────────────────────────────────────────────────────────────

  // Resolve the active domain metadata for header display
  const currentActiveDomain = domains.find((d) => d.id === selectedDomainId);

  // Client-side filter → search → sort pipeline
  const filteredAndSortedTasks = tasks
    .filter((task) => {
      if (selectedDomainId === null) return true;
      return task.domain_id === selectedDomainId;
    })
    .filter((task) => {
      if (statusFilter === "All") return true;
      return task.status === statusFilter;
    })
    .filter((task) => {
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(query);
      const descMatch = (task.description || "").toLowerCase().includes(query);
      return titleMatch || descMatch;
    })
    .sort((a, b) => {
      if (sortBy === "due_date") {
        if (a.due_date === null && b.due_date === null) return 0;
        if (a.due_date === null) return 1;
        if (b.due_date === null) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === "priority") {
        const weight = { High: 1, Medium: 2, Low: 3 };
        return weight[a.priority] - weight[b.priority];
      }
      return 0;
    });

  // ── Global Metrics ──
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);

  const activeBacklog = tasks.filter((t) => t.status !== "Completed").length;
  const inProgressSprints = tasks.filter((t) => t.status === "In Progress").length;
  const urgentClosures = tasks.filter((t) => {
    if (t.status === "Completed") return false;
    if (t.due_date === null) return false;
    const dueDate = new Date(t.due_date);
    return dueDate < tomorrowStart;
  }).length;

  // ──────────────────────────────────────────────────────────────────────
  // 6. Handler Functions (Persisting Mutations to Database via REST)
  // ──────────────────────────────────────────────────────────────────────

  /** Helper: Map a raw backend Task response to the frontend flat shape */
  const mapBackendTask = (t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    domain_id: t.domain ? t.domain.id : null,
    due_date: t.dueDate,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    completed_at: t.completedAt
  });

  const handleSaveTask = async (formFields) => {
    // Package data into the nested object structure Java/Hibernate expects
    const targetDomainObj = formFields.domain_id ? { id: formFields.domain_id } : null;

    const backendPayload = {
      user: { id: currentUser.id },
      title: formFields.title,
      description: formFields.description,
      status: taskToEdit ? taskToEdit.status : "Pending",
      priority: formFields.priority,
      dueDate: formFields.due_date ? new Date(formFields.due_date).toISOString() : null,
      domain: targetDomainObj
    };

    try {
      if (taskToEdit) {
        // ── UPDATE MODE (PUT Request) ──
        const res = await fetch(`${BACKEND_URL}/tasks/${taskToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendPayload)
        });
        if (!res.ok) throw new Error(`Update failed: ${res.status}`);
        const updatedTask = await res.json();
        setTasks(prev => prev.map(t => t.id === taskToEdit.id ? mapBackendTask(updatedTask) : t));
      } else {
        // ── CREATE MODE (POST Request) ──
        const res = await fetch(`${BACKEND_URL}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendPayload)
        });
        if (!res.ok) throw new Error(`Create failed: ${res.status}`);
        const newTask = await res.json();
        setTasks(prev => [mapBackendTask(newTask), ...prev]);
      }
      closeModal();
    } catch (err) {
      console.error("Task save error:", err);
    }
  };

  const handleToggleStatus = async (taskId) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const currentIndex = STATUS_CYCLE.indexOf(targetTask.status);
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

    const backendPayload = {
      user: { id: currentUser.id },
      title: targetTask.title,
      description: targetTask.description,
      status: nextStatus,
      priority: targetTask.priority,
      dueDate: targetTask.due_date,
      completedAt: nextStatus === "Completed" ? new Date().toISOString() : null,
      domain: targetTask.domain_id ? { id: targetTask.domain_id } : null
    };

    try {
      const res = await fetch(`${BACKEND_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload)
      });
      if (!res.ok) throw new Error(`Status toggle failed: ${res.status}`);
      const updatedTask = await res.json();
      setTasks(prev => prev.map(t => t.id === taskId ? mapBackendTask(updatedTask) : t));
    } catch (err) {
      console.error("Status toggle error:", err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks(prev => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  const handleAddDomain = async (name, emoji, colorHex) => {
    const backendPayload = {
      name: name,
      emoji: emoji,
      colorCode: colorHex,
      user: { id: currentUser.id }
    };

    try {
      const res = await fetch(`${BACKEND_URL}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload)
      });
      if (!res.ok) throw new Error(`Domain creation failed: ${res.status}`);
      const newDomain = await res.json();
      const mapped = {
        id: newDomain.id,
        name: newDomain.name,
        emoji: newDomain.emoji,
        color_code: newDomain.colorCode
      };
      setDomains(prev => [...prev, mapped]);
    } catch (err) {
      console.error("Domain creation error:", err);
    }
  };

  // ── Modal flow helpers ──
  const openAddTaskModal = () => { setTaskToEdit(null); setIsModalOpen(true); };
  const openEditTaskModal = (task) => { setTaskToEdit(task); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setTaskToEdit(null); };

  // ──────────────────────────────────────────────────────────────────────
  // 7. Authentication Gate — Render Login/Signup if no session
  // ──────────────────────────────────────────────────────────────────────
  if (!currentUser) {
    if (authView === "signup") {
      return (
        <Signup
          onLoginSuccess={handleLoginSuccess}
          onSwitchToLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={() => setAuthView("signup")}
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // 8. Ambient Engine Loading Interceptor
  // ──────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide text-slate-400 animate-pulse">
          Loading {currentUser.username}'s workspace...
        </p>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // 9. Main Application Render Tree
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar
        domains={domains}
        tasks={tasks}
        selectedDomainId={selectedDomainId}
        setSelectedDomainId={setSelectedDomainId}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onAddDomain={handleAddDomain}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div
        className="col-span-1 md:col-span-3 p-8 bg-slate-950 overflow-y-auto"
        style={
          selectedDomainId !== null && currentActiveDomain
            ? { backgroundImage: `radial-gradient(circle at top right, ${currentActiveDomain.color_code}1a, transparent 60%)` }
            : undefined
        }
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {selectedDomainId === null
                ? "📁 All Project Workspaces"
                : `${currentActiveDomain?.emoji || "📂"} ${currentActiveDomain?.name} Work View`}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Showing {filteredAndSortedTasks.length} prioritized entries matching current active display filters.
            </p>
          </div>

          <FilterControls
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onOpenAddTask={openAddTaskModal}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
        </div>

        {selectedDomainId === null && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-100">{activeBacklog}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Active Backlog</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-400">{inProgressSprints}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">In Progress Sprints</p>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
              <p className="text-2xl font-bold text-amber-400">{urgentClosures}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Urgent Closures</p>
            </div>
          </div>
        )}

        <TaskList
          tasks={filteredAndSortedTasks}
          domains={domains}
          onToggleStatus={handleToggleStatus}
          onOpenEditModal={openEditTaskModal}
          onDeleteTask={handleDeleteTask}
        />
      </div>

      <TaskForm
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSaveTask}
        domains={domains}
        selectedDomainId={selectedDomainId}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}

export default App;