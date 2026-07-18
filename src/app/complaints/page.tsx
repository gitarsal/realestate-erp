"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

const complaintStats = [
  { label: "Total Complaints", value: 234, color: "text-blue-600" },
  { label: "Open", value: 23, color: "text-red-600" },
  { label: "In Progress", value: 18, color: "text-orange-600" },
  { label: "Resolved", value: 156, color: "text-green-600" },
  { label: "Avg Resolution (hrs)", value: 36, color: "text-purple-600" },
  { label: "Satisfaction", value: "4.2", color: "text-emerald-600" },
];

export default function ComplaintsPage() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [viewingComplaint, setViewingComplaint] = useState<any>(null);
  const [updatingComplaint, setUpdatingComplaint] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets" | "categories">("tickets");
  const { toast, ToastContainer } = useToast();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("All Status");

  const [logForm, setLogForm] = useState({
    member: "",
    unit: "",
    categoryId: "",
    priority: "Medium",
    details: "",
    visitingTime: "",
  });

  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterCategory !== "All Categories") {
        const cat = categories.find((c: any) => c.name === filterCategory);
        if (cat) params.set("categoryId", cat.id);
      }
      if (filterStatus !== "All Status") {
        params.set("status", filterStatus.replace(/\s/g, "_").toLowerCase());
      }
      const res = await fetch(`/api/complaints?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load complaints");
    }
  }, [searchQuery, filterCategory, filterStatus, categories]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/complaint-categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (e: any) {
      toast(e.message || "Failed to load categories", "error");
    }
  }, [toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setLoading(true);
    fetchComplaints().finally(() => setLoading(false));
  }, [fetchComplaints]);

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      (c.memberName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.ticketNo || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "All Categories" ||
      (c.category?.name || "") === filterCategory;
    const matchesStatus =
      filterStatus === "All Status" ||
      (c.status || "").replace("_", " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: logForm.categoryId,
          memberName: logForm.member,
          blockHouseNo: logForm.unit,
          details: logForm.details,
          priority: logForm.priority.toLowerCase(),
          availableTime: logForm.visitingTime || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log complaint");
      }
      toast("Complaint logged successfully", "success");
      setShowLogModal(false);
      setLogForm({ member: "", unit: "", categoryId: "", priority: "Medium", details: "", visitingTime: "" });
      fetchComplaints();
    } catch (e: any) {
      toast(e.message || "Failed to log complaint", "error");
    }
  };

  const handleUpdateStatus = async () => {
    if (!updatingComplaint || !updateStatus) return;
    try {
      const res = await fetch(`/api/complaints/${updatingComplaint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updateStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast("Status updated", "success");
      setShowUpdateModal(false);
      setUpdatingComplaint(null);
      setUpdateStatus("");
      fetchComplaints();
    } catch (e: any) {
      toast(e.message || "Failed to update status", "error");
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Complaint Management (COMS)</h1>
        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          + Log Complaint
        </button>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {(["dashboard", "tickets", "categories"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{error}</div>
      )}

      {activeTab === "dashboard" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {complaintStats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className={`stat-card-value ${stat.color}`}>{stat.value}</div>
                <div className="stat-card-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="chart-container">
              <h3 className="font-semibold mb-4">Complaints by Category</h3>
              <div className="space-y-3">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-sm w-24">{cat.name}</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "50%" }}></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{cat.slaHours}h SLA</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-container">
              <h3 className="font-semibold mb-4">SLA Compliance</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Within SLA</span>
                    <span className="font-bold text-green-600">87%</span>
                  </div>
                  <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: "87%" }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">SLA Breach</span>
                    <span className="font-bold text-red-600">13%</span>
                  </div>
                  <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: "13%" }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Customer Satisfaction</span>
                    <span className="font-bold text-blue-600">4.2 / 5.0</span>
                  </div>
                  <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "84%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "tickets" && (
        <>
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              placeholder="Search tickets..."
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option>All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option>All Status</option>
              <option>New</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Closed</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading complaints...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ticket No</th>
                    <th>Member</th>
                    <th>Block/House</th>
                    <th>Category</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono text-sm">{c.ticketNo}</td>
                      <td className="font-medium">{c.memberName}</td>
                      <td>{c.blockHouseNo}</td>
                      <td>
                        <span className="status-badge bg-gray-100 text-gray-800">{c.category?.name || "N/A"}</span>
                      </td>
                      <td className="max-w-[200px] truncate text-sm">{c.details}</td>
                      <td>
                        <span className={`status-badge ${
                          c.status === 'new' ? 'bg-cyan-100 text-cyan-800' :
                          c.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                          c.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                          c.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {c.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          c.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          c.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          c.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {c.priority ? c.priority.charAt(0).toUpperCase() + c.priority.slice(1) : "Medium"}
                        </span>
                      </td>
                      <td className="text-sm">{c.assignedTo || "Unassigned"}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => { setViewingComplaint(c); setShowViewModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                          <button onClick={() => {
                            setUpdatingComplaint(c);
                            setUpdateStatus(c.status);
                            setShowUpdateModal(true);
                          }} className="px-2 py-1 text-xs border rounded hover:bg-muted">Update</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredComplaints.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">No complaints found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat: any) => (
            <div key={cat.id} className="chart-container">
              <h4 className="font-semibold">{cat.name}</h4>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SLA</span>
                  <span className="font-medium">{cat.slaHours}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supervisor</span>
                  <span className={`font-medium ${cat.defaultSupervisor ? 'text-green-600' : 'text-red-600'}`}>{cat.defaultSupervisor || "None"}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t flex gap-2">
                <button onClick={() => toast(`Viewing ${cat.name} complaints`, "info")} className="flex-1 px-2 py-1 text-xs border rounded">View</button>
                <button onClick={() => toast(`Editing ${cat.name} category`, "info")} className="flex-1 px-2 py-1 text-xs border rounded">Edit</button>
              </div>
            </div>
          ))}
          {categories.length === 0 && !loading && (
            <div className="col-span-full text-center py-8 text-muted-foreground">No categories found</div>
          )}
        </div>
      )}

      {showLogModal && (
        <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Log New Complaint</h2>
              <button onClick={() => setShowLogModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Member Name *</label>
                  <input
                    type="text"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="Enter member name"
                    value={logForm.member}
                    onChange={(e) => setLogForm((p) => ({ ...p, member: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Block / House No *</label>
                  <input
                    type="text"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="e.g., A-123"
                    value={logForm.unit}
                    onChange={(e) => setLogForm((p) => ({ ...p, unit: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={logForm.categoryId}
                    onChange={(e) => setLogForm((p) => ({ ...p, categoryId: e.target.value }))}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={logForm.priority}
                    onChange={(e) => setLogForm((p) => ({ ...p, priority: e.target.value }))}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Details *</label>
                <textarea
                  className="min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="Describe the complaint in detail"
                  value={logForm.details}
                  onChange={(e) => setLogForm((p) => ({ ...p, details: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Available Visiting Time</label>
                <input
                  type="text"
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="e.g., 10 AM - 2 PM"
                  value={logForm.visitingTime}
                  onChange={(e) => setLogForm((p) => ({ ...p, visitingTime: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowLogModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Submit Complaint</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingComplaint && (
        <div className="modal-overlay" onClick={() => { setShowViewModal(false); setViewingComplaint(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Complaint Details</h2>
              <button onClick={() => { setShowViewModal(false); setViewingComplaint(null); }} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Ticket No</span>
                <span className="text-sm font-medium font-mono">{viewingComplaint.ticketNo}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Member</span>
                <span className="text-sm font-medium">{viewingComplaint.memberName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Block/House</span>
                <span className="text-sm font-medium">{viewingComplaint.blockHouseNo}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="status-badge bg-gray-100 text-gray-800">{viewingComplaint.category?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Details</span>
                <span className="text-sm font-medium max-w-[300px] text-right">{viewingComplaint.details}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`status-badge ${
                  viewingComplaint.status === 'new' ? 'bg-cyan-100 text-cyan-800' :
                  viewingComplaint.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                  viewingComplaint.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                  viewingComplaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {viewingComplaint.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Priority</span>
                <span className={`status-badge ${
                  viewingComplaint.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  viewingComplaint.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  viewingComplaint.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {viewingComplaint.priority ? viewingComplaint.priority.charAt(0).toUpperCase() + viewingComplaint.priority.slice(1) : "Medium"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Assigned To</span>
                <span className="text-sm font-medium">{viewingComplaint.assignedTo || "Unassigned"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Logged At</span>
                <span className="text-sm font-medium">{viewingComplaint.loggedAt ? new Date(viewingComplaint.loggedAt).toLocaleString() : "-"}</span>
              </div>
              {viewingComplaint.availableTime && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-muted-foreground">Available Visiting Time</span>
                  <span className="text-sm font-medium">{viewingComplaint.availableTime}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowViewModal(false); setViewingComplaint(null); }} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && updatingComplaint && (
        <div className="modal-overlay" onClick={() => { setShowUpdateModal(false); setUpdatingComplaint(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Update Status - {updatingComplaint.ticketNo}</h2>
              <button onClick={() => { setShowUpdateModal(false); setUpdatingComplaint(null); }} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Current status: <span className="font-medium text-foreground">{updatingComplaint.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></p>
              <div>
                <label className="text-sm font-medium block mb-1">New Status</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button onClick={() => { setShowUpdateModal(false); setUpdatingComplaint(null); }} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button onClick={handleUpdateStatus} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Update Status</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </AppShell>
  );
}
