"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";

interface Project {
  id: string; name: string; code: string; type: string;
  location: string | null; description: string | null; isActive: boolean;
  createdAt: string; _count: { blocks: number; files: number };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({ name: "", code: "", type: "residential", location: "", description: "" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch { setError("Failed to load projects"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function openCreate() {
    setForm({ name: "", code: "", type: "residential", location: "", description: "" });
    setEditProject(null);
    setShowModal(true);
  }

  function openEdit(p: Project) {
    setForm({ name: p.name, code: p.code, type: p.type, location: p.location || "", description: p.description || "" });
    setEditProject(p);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const url = editProject ? `/api/projects/${editProject.id}` : "/api/projects";
      const method = editProject ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save project"); return; }
      setShowModal(false);
      setSuccess(editProject ? "Project updated successfully" : "Project created successfully");
      await fetchData();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete project "${name}"? This will also delete all blocks and plots.`)) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to delete"); return; }
      setSuccess("Project deleted");
      await fetchData();
    } catch { setError("Network error"); }
  }

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ New Project</button>
      </div>

      {error && <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}
      {success && <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 text-sm rounded-md border border-green-200 flex items-center justify-between"><span>{success}</span><button onClick={() => setSuccess("")} className="text-green-500 hover:text-green-700">&times;</button></div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="text-muted-foreground text-sm">Loading projects...</div></div>
      ) : (
        <>
          <div className="flex gap-3 mb-6">
            <input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">No projects found</div>
            ) : filtered.map(p => (
              <div key={p.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{p.code}</p>
                  </div>
                  <span className={`status-badge ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-1 text-sm mb-3">
                  <p><span className="text-muted-foreground">Type:</span> <span className="capitalize">{p.type}</span></p>
                  {p.location && <p><span className="text-muted-foreground">Location:</span> {p.location}</p>}
                  {p.description && <p className="text-muted-foreground text-xs truncate">{p.description}</p>}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                  <span>{p._count.blocks} blocks</span>
                  <span>{p._count.files} bookings</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(p)} className="flex-1 px-3 py-1.5 border rounded-md text-xs font-medium hover:bg-muted">Edit</button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-xs font-medium hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editProject ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Project Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. Green Valley" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Code *</label>
                  <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. GV" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. Lahore" />
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none" placeholder="Brief description..." />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : editProject ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
