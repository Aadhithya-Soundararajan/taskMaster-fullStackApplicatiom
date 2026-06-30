// ============================================================================
// App.jsx — Application Shell & State Orchestrator (v7 - Polished Hybrid)
// ============================================================================
// ARCHITECTURE NOTE (v7): Precision-optimized Hybrid Workspace design.
//   • Sidebar controls spatial domain selection (activeDomain / selectedDomainId)
//   • Horizontal Tab Bar controls chronological view (activeTab)
//   • Today's Focus is the flagship default view, positioned leftmost in tabs
//   • Two-Tier Filter Matrix cross-evaluates both dimensions before rendering
//   • Premium "All Caught Up" glassmorphic empty states per active tab context
//   • Schedule fields (taskType, frequency, recurrenceDays) are mapped from
//     backend and passed through the entire component tree
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

// ── Horizontal View Tab Definitions (Today's Focus FIRST) ──
const VIEW_TABS = [
  { key: "today",    label: "Today's Focus",      emoji: "🎯", description: "Immediate action workspace" },
  { key: "all",      label: "All Tasks",          emoji: "📂", description: "Complete master backlog" },
  { key: "routines", label: "Routines & Habits",  emoji: "🔁", description: "Recurring tracking board" },
];

// ── Day Token Map for Today's Focus computation ──
const DAY_TOKENS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// ── Empty State Copy per Tab ──
const EMPTY_STATE_CONFIG = {
  today: {
    icon: "🎯",
    headline: "You're all caught up for today!",
    subtext: "No tasks due today. Time to relax! ☕",
    accentColor: "emerald",
  },
  all: {
    icon: "📂",
    headline: "Your workspace is empty",
    subtext: "Create your first task to get started with your productivity journey.",
    accentColor: "blue",
  },
  routines: {
    icon: "🔁",
    headline: "No routines configured yet",
    subtext: "Set up recurring habits to build consistency into your daily workflow.",
    accentColor: "violet",
  },
};

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

  const [selectedDomainId, setSelectedDomainId] = useState(null); // null = "All Projects"
  const [activeTab, setActiveTab] = useState("today"); // Flagship Default: "Today's Focus"
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
        // Now includes schedule fields: taskType, frequency, recurrenceDays
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
          completed_at: t.completedAt,
          // Schedule fields from backend
          taskType: t.taskType || "ONETIME",
          frequency: t.frequency || null,
          recurrenceDays: t.recurrenceDays || null,
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
    setActiveTab("today");
    setStatusFilter("All");
    setSortBy("due_date");
    setSearchTerm("");
    setIsSidebarOpen(false);
    setIsModalOpen(false);
    setTaskToEdit(null);
  };

  // ──────────────────────────────────────────────────────────────────────
  // 5. TWO-TIER FILTER MATRIX
  // ──────────────────────────────────────────────────────────────────────

  // Resolve the active domain metadata for header display
  const currentActiveDomain = domains.find((d) => d.id === selectedDomainId);

  /**
   * TIER 1: Domain Isolation
   * If selectedDomainId is null ("All Projects"), return all tasks.
   * Otherwise, filter to match only tasks in the selected domain.
   */
  const domainFilteredTasks = selectedDomainId === null
    ? tasks
    : tasks.filter((task) => task.domain_id === selectedDomainId);

  /**
   * TIER 2: Timeline Interpretation
   * Cross-evaluates the activeTab to apply chronological filtering.
   */
  const getTodayToken = () => {
    const now = new Date();
    return DAY_TOKENS[now.getDay()]; // getDay(): 0=Sun, 1=Mon, ...
  };

  /**
   * evaluateTodayFocus — Shared predicate for "Today's Focus" filtering.
   * Used by both the main filter pipeline and the tab count computation.
   * Returns true if a task should appear in "Today's Focus".
   *
   * ONETIME: show if the parsed target date matches today OR is strictly
   * in the past (overdue items still pending).
   * RECURRING + DAILY: include automatically.
   * RECURRING + CUSTOM: include only if today's day token is inside recurrenceDays.
   */
  const evaluateTodayFocus = (task) => {
    const todayToken = getTodayToken();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);

    // If ONETIME: show if target date matches today or is overdue (strictly in the past)
    if (task.taskType === "ONETIME" || !task.taskType) {
      if (task.due_date === null) return false; // No deadline, don't show in Today
      const dueDate = new Date(task.due_date);
      // dueDate < tomorrowStart catches: overdue (past) + due today
      return dueDate < tomorrowStart;
    }

    // If RECURRING + DAILY: include automatically
    if (task.taskType === "RECURRING" && task.frequency === "DAILY") {
      return true;
    }

    // If RECURRING + CUSTOM: include only if today's token is in recurrenceDays
    if (task.taskType === "RECURRING" && task.frequency === "CUSTOM") {
      if (!task.recurrenceDays) return false;
      return task.recurrenceDays.includes(todayToken);
    }

    // Fallback: include recurring tasks without a specific frequency
    if (task.taskType === "RECURRING") {
      return true;
    }

    return false;
  };

  const timelineFilteredTasks = domainFilteredTasks.filter((task) => {
    // Tab Mode "All Tasks": Return the remaining list as-is
    if (activeTab === "all") return true;

    // Tab Mode "Routines & Habits": Drop all tasks where taskType !== 'RECURRING'
    if (activeTab === "routines") {
      return task.taskType === "RECURRING";
    }

    // Tab Mode "Today's Focus": Delegate to shared evaluator
    if (activeTab === "today") {
      return evaluateTodayFocus(task);
    }

    return true;
  });

  // Apply remaining client-side filters: status → search → sort
  const filteredAndSortedTasks = timelineFilteredTasks
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
        const weight = { High: 1, high: 1, Medium: 2, medium: 2, Low: 3, low: 3 };
        return (weight[a.priority] || 2) - (weight[b.priority] || 2);
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
  const recurringCount = tasks.filter((t) => t.taskType === "RECURRING").length;

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
    completed_at: t.completedAt,
    taskType: t.taskType || "ONETIME",
    frequency: t.frequency || null,
    recurrenceDays: t.recurrenceDays || null,
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
      domain: targetDomainObj,
      // Schedule fields
      taskType: formFields.taskType || "ONETIME",
      frequency: formFields.frequency || null,
      recurrenceDays: formFields.recurrenceDays || null,
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
      domain: targetTask.domain_id ? { id: targetTask.domain_id } : null,
      // Preserve schedule fields on status toggle
      taskType: targetTask.taskType || "ONETIME",
      frequency: targetTask.frequency || null,
      recurrenceDays: targetTask.recurrenceDays || null,
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

  // ── Helper: resolve the current view tab's metadata ──
  const currentViewTab = VIEW_TABS.find((t) => t.key === activeTab) || VIEW_TABS[0];

  // ── Helper: resolve empty state config for current tab ──
  const emptyConfig = EMPTY_STATE_CONFIG[activeTab] || EMPTY_STATE_CONFIG.all;

  // ── Accent color class mapping for empty state glassmorphic card ──
  const accentRingMap = {
    emerald: "border-emerald-500/30 shadow-emerald-500/10",
    blue: "border-blue-500/30 shadow-blue-500/10",
    violet: "border-violet-500/30 shadow-violet-500/10",
  };
  const accentTextMap = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    violet: "text-violet-400",
  };
  const accentSubtextMap = {
    emerald: "text-emerald-500/60",
    blue: "text-blue-500/60",
    violet: "text-violet-500/60",
  };
  const accentGlowMap = {
    emerald: "from-emerald-500/5 to-transparent",
    blue: "from-blue-500/5 to-transparent",
    violet: "from-violet-500/5 to-transparent",
  };

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
        {/* ── Workspace Header ── */}
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

        {/* ── HORIZONTAL VIEW TAB BAR (Today's Focus FIRST) ── */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm">
            {VIEW_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              // Compute per-tab count for the badge
              let tabCount = 0;
              const domainPool = selectedDomainId === null
                ? tasks
                : tasks.filter((t) => t.domain_id === selectedDomainId);
              if (tab.key === "all") {
                tabCount = domainPool.length;
              } else if (tab.key === "routines") {
                tabCount = domainPool.filter((t) => t.taskType === "RECURRING").length;
              } else if (tab.key === "today") {
                tabCount = domainPool.filter((t) => evaluateTodayFocus(t)).length;
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? tab.key === "routines"
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                        : tab.key === "today"
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                        : "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <span className="text-base">{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-500"
                  }`}>
                    {tabCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active tab context subtitle */}
          <p className="text-[11px] text-slate-500 mt-2 pl-1 font-medium">
            {currentViewTab.emoji} {currentViewTab.description}
            {activeTab === "today" && (
              <span className="ml-2 text-emerald-500/70">
                — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            )}
          </p>
        </div>

        {/* ── Metrics Cards (shown when viewing all domains) ── */}
        {selectedDomainId === null && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4">
              <p className="text-2xl font-bold text-violet-400">{recurringCount}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Active Routines</p>
            </div>
          </div>
        )}

        {/* ── PREMIUM EMPTY STATE or TASK LIST ── */}
        {filteredAndSortedTasks.length === 0 ? (
          /* ── Glassmorphic "All Caught Up" Empty State Card ── */
          <div className="flex items-center justify-center py-16">
            <div
              className={`relative max-w-md w-full rounded-3xl border ${accentRingMap[emptyConfig.accentColor]} bg-slate-900/30 backdrop-blur-xl shadow-2xl overflow-hidden`}
            >
              {/* Ambient gradient glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${accentGlowMap[emptyConfig.accentColor]} pointer-events-none`}></div>

              {/* Decorative floating orbs */}
              <div className="absolute top-6 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent blur-sm"></div>
              <div className="absolute bottom-8 left-6 w-14 h-14 rounded-full bg-gradient-to-tr from-white/[0.02] to-transparent blur-sm"></div>

              {/* Card content */}
              <div className="relative z-10 flex flex-col items-center text-center px-8 py-12">
                {/* Animated floating icon */}
                <div className="text-6xl mb-6 animate-bounce" style={{ animationDuration: "2.5s" }}>
                  {emptyConfig.icon}
                </div>

                {/* Headline */}
                <h3 className={`text-lg font-bold tracking-tight mb-2 ${accentTextMap[emptyConfig.accentColor]}`}>
                  {emptyConfig.headline}
                </h3>

                {/* Supporting copy */}
                <p className={`text-sm font-medium leading-relaxed max-w-xs ${accentSubtextMap[emptyConfig.accentColor]}`}>
                  {emptyConfig.subtext}
                </p>

                {/* Subtle divider line */}
                <div className={`w-16 h-px mt-6 mb-5 bg-gradient-to-r from-transparent via-slate-600 to-transparent`}></div>

                {/* CTA button */}
                <button
                  onClick={openAddTaskModal}
                  className={`text-xs font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white hover:border-slate-600 hover:shadow-lg`}
                >
                  + Create a New Task
                </button>
              </div>
            </div>
          </div>
        ) : (
          <TaskList
            tasks={filteredAndSortedTasks}
            domains={domains}
            onToggleStatus={handleToggleStatus}
            onOpenEditModal={openEditTaskModal}
            onDeleteTask={handleDeleteTask}
          />
        )}
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