"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";

interface ApiClient {
  id: string; name: string; cnic: string; phone: string;
  email: string | null; address: string | null; category: string | null;
  source: string | null; createdAt: string;
  files: { regNo: string; bookingNo: string | null; status: string; project: { id: string; name: string }; unit: { id: string; plotNo: string; block: { name: string } | null } | null }[];
}
interface RowClient {
  id: string; name: string; cnic: string; phone: string;
  email: string; address: string; category: string;
  status: string; registrationNo: string; createdAt: string;
  bookingCount: number;
}

function mapClient(c: ApiClient): RowClient {
  const files = c.files || [];
  const f = files[0];
  return {
    id: c.id, name: c.name, cnic: c.cnic, phone: c.phone,
    email: c.email || "", address: c.address || "", category: c.category || "",
    status: f?.status || "registered",
    registrationNo: f?.regNo || "—", createdAt: c.createdAt,
    bookingCount: files.length,
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<RowClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewClient, setViewClient] = useState<RowClient | null>(null);
  const [editClient, setEditClient] = useState<RowClient | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [form, setForm] = useState({ name: "", cnic: "", phone: "", email: "", category: "", address: "" });

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?pageSize=200");
      const data = await res.json();
      setClients((data.clients || []).map(mapClient));
    } catch { setError("Failed to load clients"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchClients(); }, [fetchClients]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.cnic || !form.phone) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, cnic: form.cnic, phone: form.phone,
          email: form.email || undefined, category: form.category || undefined,
          source: "manual",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      setForm({ name: "", cnic: "", phone: "", email: "", category: "", address: "" });
      setShowModal(false);
      await fetchClients();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editClient) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${editClient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editClient.name, cnic: editClient.cnic, phone: editClient.phone,
          email: editClient.email || undefined, category: editClient.category || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update"); return; }
      setShowEditModal(false);
      setEditClient(null);
      await fetchClients();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete client "${name}"? This will also delete all their bookings, payments, and records.`)) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to delete"); return; }
      await fetchClients();
    } catch { setError("Network error"); }
  }

  const filteredClients = clients.filter(
    (c) => (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cnic.includes(searchTerm) ||
            c.registrationNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
           (filterStatus === "All" || c.status === filterStatus.toLowerCase())
  );

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
          + New Client
        </button>
      </div>

      {error && <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}

      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search by name, CNIC, or registration no..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value="All">All Status</option>
          <option value="active">Active</option>
          <option value="registered">Registered</option>
          <option value="cancelled">Cancelled</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading clients...</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Reg. No</th><th>Client Name</th><th>CNIC</th><th>Phone</th>
              <th>Bookings</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No clients found</td></tr>
            )}
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td className="font-mono text-sm">{client.registrationNo}</td>
                <td className="font-medium">{client.name}</td>
                <td className="font-mono text-sm">{client.cnic}</td>
                <td>{client.phone}</td>
                <td>{client.bookingCount > 0 ? client.bookingCount : "—"}</td>
                <td>
                  <span className={`status-badge ${
                    client.status === 'active' ? 'bg-green-100 text-green-800' :
                    client.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    client.status === 'transferred' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => { setViewClient(client); setShowViewModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                    <button onClick={() => { setEditClient({ ...client }); setShowEditModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">Edit</button>
                    <button onClick={() => handleDelete(client.id, client.name)} className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50">Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Client</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Full Name *</label>
                  <input type="text" required className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="Enter full name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">CNIC *</label>
                  <input type="text" required className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="35201-1234567-1" maxLength={15} value={form.cnic} onChange={(e) => updateField("cnic", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Phone *</label>
                  <input type="text" required className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="+92 300 1234567" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="email@example.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Category</label>
                  <select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.category} onChange={(e) => updateField("category", e.target.value)}>
                    <option value="">Select Category</option>
                    <option>A - Direct</option>
                    <option>B - Referral</option>
                    <option>C - Agent</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Address</label>
                <textarea className="min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Full address" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save Client"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewClient && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Client Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-muted-foreground">Registration No</label><p className="font-mono text-sm font-medium">{viewClient.registrationNo}</p></div>
                <div><label className="text-xs text-muted-foreground">Status</label><p><span className={`status-badge ${viewClient.status === 'active' ? 'bg-green-100 text-green-800' : viewClient.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{viewClient.status.charAt(0).toUpperCase() + viewClient.status.slice(1)}</span></p></div>
                <div><label className="text-xs text-muted-foreground">Client Name</label><p className="font-medium">{viewClient.name}</p></div>
                <div><label className="text-xs text-muted-foreground">CNIC</label><p className="font-mono text-sm">{viewClient.cnic}</p></div>
                <div><label className="text-xs text-muted-foreground">Phone</label><p>{viewClient.phone}</p></div>
                <div><label className="text-xs text-muted-foreground">Email</label><p>{viewClient.email || "—"}</p></div>
                <div><label className="text-xs text-muted-foreground">Category</label><p>{viewClient.category || "—"}</p></div>
                <div><label className="text-xs text-muted-foreground">Bookings</label><p className="font-medium">{viewClient.bookingCount > 0 ? viewClient.bookingCount : "None"}</p></div>
                <div><label className="text-xs text-muted-foreground">Registered</label><p className="text-sm">{new Date(viewClient.createdAt).toLocaleDateString()}</p></div>
              </div>
              {viewClient.address && <div><label className="text-xs text-muted-foreground">Address</label><p className="text-sm">{viewClient.address}</p></div>}
            </div>
            <div className="flex justify-end pt-4"><button onClick={() => setShowViewModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button></div>
          </div>
        </div>
      )}

      {showEditModal && editClient && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Client</h2>
              <button onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Full Name *</label>
                  <input type="text" required className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editClient.name} onChange={(e) => setEditClient({ ...editClient, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">CNIC *</label>
                  <input type="text" required className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editClient.cnic} onChange={(e) => setEditClient({ ...editClient, cnic: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Phone *</label>
                  <input type="text" required className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editClient.phone} onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Email</label>
                  <input type="email" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editClient.email} onChange={(e) => setEditClient({ ...editClient, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Category</label>
                  <select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editClient.category} onChange={(e) => setEditClient({ ...editClient, category: e.target.value })}>
                    <option value="">Select Category</option>
                    <option>A - Direct</option>
                    <option>B - Referral</option>
                    <option>C - Agent</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
