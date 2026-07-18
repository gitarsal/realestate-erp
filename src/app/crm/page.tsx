"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  project: string;
  projectId: string;
  budget: number;
  source: string;
  leadType: string;
  status: string;
  priority: string;
  notes: string;
  lastFollowup: string;
  followups: any[];
}

interface Followup {
  id: string;
  leadId: string;
  leadName: string;
  date: string;
  priority: string;
  note: string;
  status: string;
}

const sourceData = [
  { source: "Facebook", color: "bg-blue-500" },
  { source: "Website", color: "bg-green-500" },
  { source: "WhatsApp", color: "bg-emerald-500" },
  { source: "Referral", color: "bg-purple-500" },
  { source: "Walk-in", color: "bg-orange-500" },
  { source: "Manual", color: "bg-gray-500" },
];

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLead, setViewLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<"leads" | "followups" | "dashboard">("leads");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [submitting, setSubmitting] = useState(false);
  const { toast, ToastContainer } = useToast();
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    projectId: "",
    budget: "",
    source: "Manual",
    leadType: "",
    notes: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      const rows: Lead[] = (data.leads || []).map((l: any) => ({
        id: l.id,
        name: l.name || "—",
        phone: l.phone || "—",
        email: l.email || "",
        project: l.project?.name || l.projectId || "—",
        projectId: l.projectId || "",
        budget: l.budget || 0,
        source: l.source || "—",
        leadType: l.leadType || "",
        status: l.status || "new",
        priority: l.leadType || "medium",
        notes: l.notes || "",
        lastFollowup: l.updatedAt ? new Date(l.updatedAt).toISOString().split("T")[0] : "—",
        followups: l.followups || [],
      }));
      setLeads(rows);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
      toast("Failed to load leads", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchFollowups = useCallback(async () => {
    try {
      const res = await fetch("/api/followups");
      if (res.ok) {
        const data = await res.json();
        const rows: Followup[] = (data.followups || []).map((f: any) => ({
          id: f.id,
          leadId: f.leadId,
          leadName: f.lead?.name || "—",
          date: f.date ? new Date(f.date).toISOString().split("T")[0] : "—",
          priority: f.priority || "medium",
          note: f.note || "",
          status: f.status || "pending",
        }));
        setFollowups(rows);
      }
    } catch {}
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchFollowups();
    fetchProjects();
  }, [fetchLeads, fetchFollowups, fetchProjects]);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast("Name and phone are required", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          source: form.source || undefined,
          leadType: form.leadType || undefined,
          budget: form.budget ? Number(form.budget) : undefined,
          notes: form.notes || undefined,
          projectId: form.projectId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add lead");
      }

      toast("Lead added successfully", "success");
      setForm({ name: "", phone: "", email: "", projectId: "", budget: "", source: "Manual", leadType: "", notes: "" });
      setShowAddModal(false);
      fetchLeads();
    } catch (e: any) {
      toast(e.message || "Failed to add lead", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteFollowup(id: string) {
    try {
      const res = await fetch("/api/followups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "completed" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete followup");
      }

      toast("Follow-up completed", "success");
      fetchFollowups();
    } catch (e: any) {
      toast(e.message || "Failed to complete followup", "error");
    }
  }

  const filteredLeads = leads.filter(
    (l) => (l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.phone.includes(searchTerm) ||
            l.project.toLowerCase().includes(searchTerm.toLowerCase())) &&
           (filterSource === "All" || l.source === filterSource) &&
           (filterStatus === "All" || l.status === filterStatus.toLowerCase())
  );

  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    active: leads.filter((l) => l.status === "active").length,
    qualified: leads.filter((l) => l.status === "qualified").length,
    closedWon: leads.filter((l) => l.status === "closed_won").length,
    closedLost: leads.filter((l) => l.status === "closed_lost").length,
  };

  const sourceCounts = sourceData.map((s) => ({
    ...s,
    count: leads.filter((l) => l.source === s.source).length,
  }));

  const followupStats = {
    pending: followups.filter((f) => f.status === "pending").length,
    completed: followups.filter((f) => f.status === "completed").length,
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">CRM - Leads Management</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          + New Lead
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {(["dashboard", "leads", "followups"] as const).map((tab) => (
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

      {activeTab === "dashboard" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-card-value text-blue-600">{stats.total}</div>
              <div className="stat-card-label">Total Leads</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-cyan-600">{stats.new}</div>
              <div className="stat-card-label">New Leads</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-green-600">{stats.active}</div>
              <div className="stat-card-label">Active Leads</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-purple-600">{stats.qualified}</div>
              <div className="stat-card-label">Qualified</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-emerald-600">{stats.closedWon}</div>
              <div className="stat-card-label">Closed Won</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-red-600">{stats.closedLost}</div>
              <div className="stat-card-label">Closed Lost</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="chart-container">
              <h3 className="font-semibold mb-4">Leads by Source</h3>
              <div className="space-y-3">
                {sourceCounts.map((s) => (
                  <div key={s.source} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${s.color}`}></div>
                    <span className="text-sm flex-1">{s.source}</span>
                    <span className="text-sm font-medium">{s.count}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-container">
              <h3 className="font-semibold mb-4">Sales Pipeline</h3>
              <div className="space-y-2">
                {[
                  { stage: "New", count: stats.new, color: "bg-cyan-500" },
                  { stage: "Active", count: stats.active, color: "bg-blue-500" },
                  { stage: "Qualified", count: stats.qualified, color: "bg-purple-500" },
                  { stage: "Closed Won", count: stats.closedWon, color: "bg-green-500" },
                ].map((s) => (
                  <div key={s.stage} className="flex items-center gap-3">
                    <span className="text-sm w-24">{s.stage}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                      <div className={`h-full ${s.color} rounded`} style={{ width: `${stats.total > 0 ? (s.count / stats.total) * 100 : 0}%` }}></div>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">{s.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "leads" && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-muted-foreground text-sm">Loading leads...</div>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-6">
                <input 
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96"
                />
                <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="All">All Sources</option>
                  {sourceData.map((s) => (
                    <option key={s.source}>{s.source}</option>
                  ))}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                  <option value="All">All Status</option>
                  <option value="new">New</option>
                  <option value="active">Active</option>
                  <option value="qualified">Qualified</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>
                <button onClick={() => toast("Leads exported to Excel", "success")} className="px-3 py-2 border rounded-md text-sm font-medium">Export</button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Project</th>
                      <th>Budget</th>
                      <th>Source</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Last Follow-up</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">No leads found</td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="font-medium">{lead.name}</td>
                          <td>{lead.phone}</td>
                          <td>{lead.project}</td>
                          <td>PKR {lead.budget.toLocaleString()}</td>
                          <td>
                            <span className="status-badge bg-gray-100 text-gray-800">{lead.source}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${
                              lead.status === 'new' ? 'bg-cyan-100 text-cyan-800' :
                              lead.status === 'active' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                              lead.status === 'closed_won' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {lead.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${
                              lead.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                            </span>
                          </td>
                          <td className="text-muted-foreground">{lead.lastFollowup}</td>
                          <td>
                            <div className="flex gap-1">
                              <button onClick={() => { setViewLead(lead); setShowViewModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                              <button onClick={() => toast("Initiating call...", "info")} className="px-2 py-1 text-xs border rounded hover:bg-muted">Call</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "followups" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-card-value text-orange-600">{followupStats.pending}</div>
              <div className="stat-card-label">Pending Follow-ups</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-green-600">{followupStats.completed}</div>
              <div className="stat-card-label">Completed This Month</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-red-600">0</div>
              <div className="stat-card-label">Overdue</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-blue-600">{followupStats.completed + followupStats.pending > 0 ? Math.round((followupStats.completed / (followupStats.completed + followupStats.pending)) * 100) : 0}%</div>
              <div className="stat-card-label">Completion Rate</div>
            </div>
          </div>

          <div className="chart-container">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Upcoming Follow-ups</h3>
              <button onClick={() => toast("Opening calendar view", "info")} className="px-3 py-1 border rounded-md text-xs font-medium">View Calendar</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Note</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {followups.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No follow-ups found</td>
                    </tr>
                  ) : (
                    followups.map((f) => (
                      <tr key={f.id}>
                        <td className="font-medium">{f.leadName}</td>
                        <td>{f.date}</td>
                        <td>
                          <span className={`status-badge ${
                            f.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            f.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {f.priority.charAt(0).toUpperCase() + f.priority.slice(1)}
                          </span>
                        </td>
                        <td className="text-sm text-muted-foreground">{f.note}</td>
                        <td>
                          <span className={`status-badge ${
                            f.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            {f.status === 'pending' ? (
                              <button onClick={() => handleCompleteFollowup(f.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Complete</button>
                            ) : (
                              <button disabled className="px-2 py-1 text-xs bg-gray-300 text-gray-500 rounded cursor-not-allowed">Completed</button>
                            )}
                            <button onClick={() => toast("Follow-up rescheduled", "info")} className="px-2 py-1 text-xs border rounded">Reschedule</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* View Lead Modal */}
      {showViewModal && viewLead && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Lead Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <p className="font-medium">{viewLead.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Phone</label>
                  <p>{viewLead.phone}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Email</label>
                  <p>{viewLead.email || "—"}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Project</label>
                  <p className="font-medium">{viewLead.project}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Budget</label>
                  <p className="font-medium">PKR {viewLead.budget.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Source</label>
                  <p><span className="status-badge bg-gray-100 text-gray-800">{viewLead.source}</span></p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <p>
                    <span className={`status-badge ${
                      viewLead.status === 'new' ? 'bg-cyan-100 text-cyan-800' :
                      viewLead.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      viewLead.status === 'qualified' ? 'bg-purple-100 text-purple-800' :
                      viewLead.status === 'closed_won' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {viewLead.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Last Follow-up</label>
                  <p className="font-medium">{viewLead.lastFollowup}</p>
                </div>
              </div>
              {viewLead.notes && (
                <div>
                  <label className="text-xs text-muted-foreground">Notes</label>
                  <p className="text-sm">{viewLead.notes}</p>
                </div>
              )}
              {viewLead.followups && viewLead.followups.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground">Follow-ups</label>
                  <div className="mt-1 space-y-1">
                    {viewLead.followups.map((fu: any) => (
                      <div key={fu.id} className="text-sm p-2 bg-muted rounded">
                        {fu.date ? new Date(fu.date).toLocaleDateString() : "—"} - {fu.note || "—"} ({fu.status || "pending"})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Name *</label>
                  <input type="text" required value={form.name} onChange={(e) => updateField("name", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="Lead name" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Phone *</label>
                  <input type="text" required value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="+92 300 1234567" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Project Interest</label>
                  <select value={form.projectId} onChange={(e) => updateField("projectId", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Budget</label>
                  <input type="number" value={form.budget} onChange={(e) => updateField("budget", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="5000000" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Source</label>
                  <select value={form.source} onChange={(e) => updateField("source", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option>Manual</option>
                    <option>Facebook</option>
                    <option>Website</option>
                    <option>WhatsApp</option>
                    <option>Referral</option>
                    <option>Walk-in</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Lead Type</label>
                  <select value={form.leadType} onChange={(e) => updateField("leadType", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Select Type</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Notes</label>
                <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} className="min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Additional notes about this lead" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
                  {submitting ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </AppShell>
  );
}
