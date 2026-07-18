"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<"goals" | "tasks">("goals");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, ToastContainer } = useToast();

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formOwner, setFormOwner] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formPriority, setFormPriority] = useState("medium");

  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskFilterStatus, setTaskFilterStatus] = useState("All Status");

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      const data = await res.json();
      setGoals(data);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load goals");
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (taskFilterStatus !== "All Status") {
        params.set("status", taskFilterStatus.replace(/\s/g, "_").toLowerCase());
      }
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load tasks");
    }
  }, [taskFilterStatus]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchGoals(), fetchTasks()]);
    setLoading(false);
  }, [fetchGoals, fetchTasks]);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(taskSearchQuery.toLowerCase());
    return matchesSearch;
  });

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormOwner("");
    setFormDueDate("");
    setFormPriority("medium");
  };

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setShowViewModal(true);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      toast("Task marked as completed", "success");
      fetchTasks();
    } catch (e: any) {
      toast(e.message || "Failed to complete task", "error");
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) { toast("Please enter a goal title", "error"); return; }
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || undefined,
          ownerId: formOwner || "unassigned",
          targetDate: formDueDate || undefined,
          priority: formPriority,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create goal");
      }
      toast("Goal created successfully", "success");
      setShowGoalModal(false);
      resetForm();
      fetchGoals();
    } catch (e: any) {
      toast(e.message || "Failed to create goal", "error");
    }
  };

  const getGoalTitle = (goalId: string | null) => {
    if (!goalId) return "N/A";
    const goal = goals.find((g: any) => g.id === goalId);
    return goal ? goal.title : "N/A";
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Task & Goal Management (TMS)</h1>
        <button onClick={() => setShowGoalModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
          + New {activeTab === "goals" ? "Goal" : "Task"}
        </button>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {(["goals", "tasks"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{error}</div>
      )}

      {activeTab === "goals" && (
        <>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading goals...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.map((g: any) => (
                <div key={g.id} className="chart-container">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{g.title}</h4>
                      <p className="text-sm text-muted-foreground">Owner: {g.ownerId}</p>
                    </div>
                    <span className="text-sm font-medium">{g.completionPct || 0}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${g.completionPct || 0}%` }}></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{g._count?.tasks || 0} tasks</span>
                    <span>Due: {g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "TBD"}</span>
                  </div>
                </div>
              ))}
              {goals.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">No goals found. Create one!</div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "tasks" && (
        <>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Search tasks..."
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96"
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={taskFilterStatus}
              onChange={(e) => setTaskFilterStatus(e.target.value)}
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Task</th>
                    <th>Goal</th>
                    <th>Owner</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Time Spent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-sm">{t.id.slice(0, 8)}</td>
                      <td className="font-medium">{t.title}</td>
                      <td className="text-sm text-muted-foreground">{getGoalTitle(t.goalId).slice(0, 30)}</td>
                      <td>{t.ownerId}</td>
                      <td className="text-muted-foreground">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "TBD"}</td>
                      <td>
                        <span className={`status-badge ${t.priority === 'urgent' ? 'bg-red-100 text-red-800' : t.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${t.status === 'completed' ? 'bg-green-100 text-green-800' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {t.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      </td>
                      <td>{Math.floor((t.timeSpent || 0) / 60)}h {(t.timeSpent || 0) % 60}m</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => handleViewTask(t)} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                          {t.status !== 'completed' && <button onClick={() => handleCompleteTask(t.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Complete</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No tasks found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Goal</h2>
              <button onClick={() => setShowGoalModal(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleAddGoal}>
              <div className="form-group">
                <label className="text-sm font-medium">Goal Title *</label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" placeholder="Enter goal title" required />
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Description</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm w-full" placeholder="Describe the goal..." />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Owner</label>
                  <select value={formOwner} onChange={(e) => setFormOwner(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full">
                    <option value="">Select owner</option>
                    <option value="Sales Head">Sales Head</option>
                    <option value="Operations Head">Operations Head</option>
                    <option value="Construction Head">Construction Head</option>
                    <option value="Finance Head">Finance Head</option>
                    <option value="HR">HR</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Target Date</label>
                  <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" />
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Priority</label>
                <select value={formPriority} onChange={(e) => setFormPriority(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowGoalModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Task Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">ID</span><span className="text-sm font-mono">{selectedTask.id}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Title</span><span className="text-sm font-medium">{selectedTask.title}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Goal</span><span className="text-sm">{getGoalTitle(selectedTask.goalId)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Owner</span><span className="text-sm">{selectedTask.ownerId}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Due Date</span><span className="text-sm">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "TBD"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Priority</span>
                <span className={`status-badge ${selectedTask.priority === 'urgent' ? 'bg-red-100 text-red-800' : selectedTask.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span>
                <span className={`status-badge ${selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' : selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedTask.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Time Spent</span><span className="text-sm">{Math.floor((selectedTask.timeSpent || 0) / 60)}h {(selectedTask.timeSpent || 0) % 60}m</span></div>
            </div>
            <div className="flex justify-end gap-2 pt-6">
              <button type="button" onClick={() => setShowViewModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </AppShell>
  );
}
