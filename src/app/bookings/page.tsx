"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

interface Booking {
  id: string; regNo: string; bookingNo: string; clientId: string; clientName: string; clientCnic: string; clientPhone: string;
  projectId: string; projectName: string; unitId: string; plotNo: string; blockName: string;
  unitPrice: number; totalAmount: number; downPayment: number; rebateAmount: number;
  totalPaid: number; remaining: number; totalInstallments: number; paidInstallments: number;
  status: string; createdAt: string;
}
interface Client { id: string; name: string; cnic: string; phone: string; }
interface Project { id: string; name: string; }
interface Unit { id: string; plotNo: string; block: { name: string } | null; price: number | null; status: string; }

export default function BookingsPage() {
  return (
    <Suspense fallback={<AppShell><div className="flex items-center justify-center py-20"><div className="text-muted-foreground text-sm">Loading...</div></div></AppShell>}>
      <BookingsContent />
    </Suspense>
  );
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const preProjectId = searchParams.get("projectId") || "";
  const preUnitId = searchParams.get("unitId") || "";
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [payBooking, setPayBooking] = useState<Booking | null>(null);
  const [payForm, setPayForm] = useState({ amount: "", mode: "cash", narration: "" });
  const [editUnits, setEditUnits] = useState<Unit[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [form, setForm] = useState({ clientId: "", projectId: "", unitId: "", totalAmount: "", downPayment: "", installmentCount: "12", installmentMonths: "1" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bkRes, clRes, pjRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/clients?pageSize=500"),
        fetch("/api/projects"),
      ]);
      const bkData = await bkRes.json();
      const clData = await clRes.json();
      const pjData = await pjRes.json();
      setBookings(bkData.bookings || []);
      setClients((clData.clients || []).map((c: any) => ({ id: c.id, name: c.name, cnic: c.cnic, phone: c.phone })));
      setProjects(pjData.projects || []);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (preProjectId && preUnitId) {
      setForm(prev => ({ ...prev, projectId: preProjectId, unitId: preUnitId }));
      setShowModal(true);
    } else if (preProjectId) {
      setForm(prev => ({ ...prev, projectId: preProjectId }));
      setShowModal(true);
    }
  }, [preProjectId, preUnitId]);

  useEffect(() => {
    if (!form.projectId) { setUnits([]); return; }
    fetch(`/api/units?projectId=${form.projectId}`)
      .then(r => r.json()).then(d => {
        const all = d.units || [];
        // Show available units, plus the pre-selected unit even if held/booked
        const filtered = form.unitId
          ? all.filter((u: Unit) => u.status === 'available' || u.id === form.unitId)
          : all.filter((u: Unit) => u.status === 'available');
        setUnits(filtered);
      }).catch(() => setUnits([]));
  }, [form.projectId, form.unitId]);

  useEffect(() => {
    if (!showEditModal || !editBooking?.projectId) { setEditUnits([]); return; }
    fetch(`/api/units?projectId=${editBooking.projectId}`)
      .then(r => r.json()).then(d => {
        const all = d.units || [];
        // Show available units + currently assigned unit
        const filtered = all.filter((u: Unit) => u.status === 'available' || u.id === editBooking.unitId);
        setEditUnits(filtered);
      }).catch(() => setEditUnits([]));
  }, [showEditModal, editBooking?.projectId, editBooking?.unitId]);

  function updateField(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "projectId") { next.unitId = ""; next.totalAmount = ""; }
      if (field === "unitId") {
        const u = units.find((u) => u.id === value);
        if (u?.price) next.totalAmount = String(Number(u.price));
      }
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.projectId || !form.totalAmount) { setError("Please select client, project, and enter total amount"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create booking"); return; }
      const bookingNo = data.booking?.file?.bookingNo || "";
      setShowModal(false);
      setForm({ clientId: "", projectId: "", unitId: "", totalAmount: "", downPayment: "", installmentCount: "12", installmentMonths: "1" });
      await fetchData();
      if (bookingNo) {
        setSuccess(`Booking created successfully! Booking No: ${bookingNo}`);
      }
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBooking) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/bookings/${editBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: editBooking.unitId || null,
          totalAmount: String(editBooking.totalAmount),
          downPayment: String(editBooking.downPayment),
          status: editBooking.status,
        }),
      });
      if (!res.ok) { setError("Failed to update booking"); return; }
      setShowEditModal(false); setEditBooking(null);
      await fetchData();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  const filtered = bookings.filter(
    (b) => (b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.plotNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
           (filterProject === "All" || b.projectName === filterProject) &&
           (filterStatus === "All" || b.status === filterStatus)
  );

  const stats = {
    total: bookings.length,
    active: bookings.filter((b) => b.status === "active").length,
    fullyPaid: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const selectedClient = clients.find((c) => c.id === form.clientId);

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Bookings Management</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ New Booking</button>
      </div>

      {error && <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}
      {success && <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 text-sm rounded-md border border-green-200 flex items-center justify-between"><span>{success}</span><button onClick={() => setSuccess("")} className="text-green-500 hover:text-green-700">&times;</button></div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="text-muted-foreground text-sm">Loading bookings...</div></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="stat-card"><div className="stat-card-value text-blue-600">{stats.total}</div><div className="stat-card-label">Total Bookings</div></div>
            <div className="stat-card"><div className="stat-card-value text-green-600">{stats.active}</div><div className="stat-card-label">Active</div></div>
            <div className="stat-card"><div className="stat-card-value text-emerald-600">{stats.fullyPaid}</div><div className="stat-card-label">Fully Paid</div></div>
            <div className="stat-card"><div className="stat-card-value text-red-600">{stats.cancelled}</div><div className="stat-card-label">Cancelled</div></div>
          </div>

          <div className="flex gap-3 mb-6">
            <input type="text" placeholder="Search by client, reg no, or plot..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96" />
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="All">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                   <th>Booking No</th><th>Reg No</th><th>Client</th><th>Project</th><th>Plot</th>
                  <th>Total Price</th><th>Paid</th><th>Remaining</th><th>Installments</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-8 text-muted-foreground text-sm">No bookings found</td></tr>
                ) : filtered.map((b) => (
                  <tr key={b.id}>
                    <td className="font-mono text-sm font-medium">{b.bookingNo || '—'}</td>
                    <td className="font-mono text-xs text-muted-foreground">{b.regNo}</td>
                    <td className="font-medium">{b.clientName}</td>
                    <td>{b.projectName}</td>
                    <td>{b.blockName ? `${b.blockName}-` : ""}{b.plotNo}</td>
                    <td className="font-medium">PKR {b.totalAmount.toLocaleString()}</td>
                    <td className="text-green-600">PKR {b.totalPaid.toLocaleString()}</td>
                    <td className="text-orange-600">PKR {b.remaining.toLocaleString()}</td>
                    <td>{b.paidInstallments}/{b.totalInstallments}</td>
                    <td>
                      <span className={`status-badge ${b.status === 'active' ? 'bg-green-100 text-green-800' : b.status === 'completed' ? 'bg-blue-100 text-blue-800' : b.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {b.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setViewBooking(b); setShowViewModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                        <button onClick={() => { setEditBooking({ ...b }); setShowEditModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* New Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Booking</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Client *</label>
                  <select required value={form.clientId} onChange={(e) => updateField("clientId", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Select Client</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.cnic})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Project *</label>
                  <select required value={form.projectId} onChange={(e) => updateField("projectId", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Select Project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Plot / Unit</label>
                  <select disabled={!form.projectId} value={form.unitId} onChange={(e) => updateField("unitId", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm disabled:opacity-50">
                    <option value="">{form.projectId ? "Select Plot (optional)" : "Select project first"}</option>
                    {units.map((u) => <option key={u.id} value={u.id}>{u.block?.name || ""}-Plot {u.plotNo}{u.price ? ` (PKR ${Number(u.price).toLocaleString()})` : ""}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Total Amount (PKR) *</label>
                  <input type="number" required min="0" value={form.totalAmount} onChange={(e) => updateField("totalAmount", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Down Payment (PKR)</label>
                  <input type="number" min="0" value={form.downPayment} onChange={(e) => updateField("downPayment", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Installments</label>
                  <input type="number" min="1" max="120" value={form.installmentCount} onChange={(e) => updateField("installmentCount", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Every (months)</label>
                  <input type="number" min="1" max="12" value={form.installmentMonths} onChange={(e) => updateField("installmentMonths", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
              </div>
              {selectedClient && (
                <div className="p-3 bg-muted/50 rounded-md text-sm">
                  <span className="font-medium">Selected:</span> {selectedClient.name} | CNIC: {selectedClient.cnic} | Phone: {selectedClient.phone}
                </div>
              )}
              {form.totalAmount && form.installmentCount && (
                <div className="p-3 bg-muted/50 rounded-md text-sm grid grid-cols-3 gap-4">
                  <div><span className="text-muted-foreground">Down Payment:</span> <span className="font-medium">PKR {(parseFloat(form.downPayment || '0')).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Per Installment:</span> <span className="font-medium">PKR {((parseFloat(form.totalAmount) - parseFloat(form.downPayment || '0')) / parseInt(form.installmentCount)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                  <div><span className="text-muted-foreground">Total to Pay:</span> <span className="font-medium">PKR {parseFloat(form.totalAmount).toLocaleString()}</span></div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">{saving ? "Creating..." : "Confirm Booking"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Booking Modal */}
      {showViewModal && viewBooking && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Booking Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-muted-foreground">Booking No</label><p className="font-mono text-sm font-medium">{viewBooking.bookingNo || '—'}</p></div>
                <div><label className="text-xs text-muted-foreground">Reg No</label><p className="font-mono text-xs text-muted-foreground">{viewBooking.regNo}</p></div>
                <div><label className="text-xs text-muted-foreground">Status</label><p>                  <span className={`status-badge ${viewBooking.status === 'active' ? 'bg-green-100 text-green-800' : viewBooking.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{viewBooking.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></p></div>
                <div><label className="text-xs text-muted-foreground">Client</label><p className="font-medium">{viewBooking.clientName}</p></div>
                <div><label className="text-xs text-muted-foreground">CNIC</label><p className="font-mono text-sm">{viewBooking.clientCnic}</p></div>
                <div><label className="text-xs text-muted-foreground">Phone</label><p>{viewBooking.clientPhone}</p></div>
                <div><label className="text-xs text-muted-foreground">Project</label><p className="font-medium">{viewBooking.projectName}</p></div>
                <div><label className="text-xs text-muted-foreground">Plot</label><p className="font-medium">{viewBooking.blockName ? `${viewBooking.blockName}-` : ""}{viewBooking.plotNo}</p></div>
                <div><label className="text-xs text-muted-foreground">Registered</label><p className="text-sm">{new Date(viewBooking.createdAt).toLocaleDateString()}</p></div>
              </div>
              <div className="border-t pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><label className="text-xs text-muted-foreground">Total Price</label><p className="font-medium">PKR {viewBooking.totalAmount.toLocaleString()}</p></div>
                <div><label className="text-xs text-muted-foreground">Down Payment</label><p className="font-medium">PKR {viewBooking.downPayment.toLocaleString()}</p></div>
                <div><label className="text-xs text-muted-foreground">Total Paid</label><p className="font-medium text-green-600">PKR {viewBooking.totalPaid.toLocaleString()}</p></div>
                <div><label className="text-xs text-muted-foreground">Remaining</label><p className="font-medium text-orange-600">PKR {viewBooking.remaining.toLocaleString()}</p></div>
              </div>
              <div className="border-t pt-4">
                <label className="text-xs text-muted-foreground">Installments</label>
                <p className="font-medium">{viewBooking.paidInstallments} of {viewBooking.totalInstallments} paid</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Booking Modal */}
      {showEditModal && editBooking && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Booking — {editBooking.regNo}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                <span className="font-medium">Client:</span> {editBooking.clientName} | <span className="font-medium">Project:</span> {editBooking.projectName}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Plot / Unit</label>
                  <select value={editBooking.unitId} onChange={(e) => setEditBooking({ ...editBooking, unitId: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">No Plot Assigned</option>
                    {editUnits.map((u) => <option key={u.id} value={u.id}>{u.block?.name || ""}-Plot {u.plotNo}{u.price ? ` (PKR ${Number(u.price).toLocaleString()})` : ""}{u.status === 'booked' && u.id !== editBooking.unitId ? ' [Booked]' : ''}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Status</label>
                  <select value={editBooking.status} onChange={(e) => setEditBooking({ ...editBooking, status: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="transferred">Transferred</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Total Amount (PKR)</label>
                  <input type="number" min="0" value={editBooking.totalAmount} onChange={(e) => setEditBooking({ ...editBooking, totalAmount: parseFloat(e.target.value) || 0 })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Down Payment (PKR)</label>
                  <input type="number" min="0" value={editBooking.downPayment} onChange={(e) => setEditBooking({ ...editBooking, downPayment: parseFloat(e.target.value) || 0 })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
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
