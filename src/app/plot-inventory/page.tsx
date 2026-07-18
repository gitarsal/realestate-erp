"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";

interface Project { id: string; name: string; }
interface Block { id: string; name: string; }
interface Unit {
  id: string; plotNo: string; category: string; size: number; sizeUnit: string;
  price: number; status: string;
  block: { id: string; name: string; project: { id: string; name: string } };
}

export default function PlotInventoryPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [filterProject, setFilterProject] = useState("All");
  const [filterBlock, setFilterBlock] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);

  const [addForm, setAddForm] = useState({
    projectId: "", blockName: "", plotNo: "", category: "residential",
    size: "", sizeUnit: "sqft", price: "",
  });

  const [bulkForm, setBulkForm] = useState({
    projectId: "", blockName: "", startNo: "", endNo: "",
    category: "residential", size: "", sizeUnit: "sqft", price: "",
  });

  const [editForm, setEditForm] = useState({ plotNo: "", category: "residential", size: "", sizeUnit: "sqft", price: "" });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [uRes, pRes] = await Promise.all([
        fetch("/api/units?all=1"),
        fetch("/api/projects"),
      ]);
      const uData = await uRes.json();
      const pData = await pRes.json();
      setUnits(uData.units || []);
      setProjects(pData.projects || []);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const uniqueBlocks = [...new Set(units.filter(u => filterProject === "All" || u.block.project.name === filterProject).map(u => u.block.name))].sort();

  const filtered = units.filter(u => {
    if (filterProject !== "All" && u.block.project.name !== filterProject) return false;
    if (filterBlock !== "All" && u.block.name !== filterBlock) return false;
    if (filterStatus !== "All" && u.status !== filterStatus) return false;
    if (searchTerm && !u.plotNo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: filtered.length,
    available: filtered.filter(u => u.status === 'available').length,
    booked: filtered.filter(u => u.status === 'booked').length,
    sold: filtered.filter(u => u.status === 'sold').length,
    hold: filtered.filter(u => u.status === 'hold').length,
  };

  async function handleAddSingle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: addForm.projectId,
          blockName: addForm.blockName,
          plots: [{ plotNo: addForm.plotNo, category: addForm.category, size: addForm.size, sizeUnit: addForm.sizeUnit, price: addForm.price }],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create plot"); return; }
      setShowAddModal(false);
      setSuccess("Plot created successfully");
      setAddForm({ projectId: "", blockName: "", plotNo: "", category: "residential", size: "", sizeUnit: "sqft", price: "" });
      await fetchData();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleBulkAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: bulkForm.projectId,
          blockName: bulkForm.blockName,
          bulk: {
            startNo: bulkForm.startNo,
            endNo: bulkForm.endNo,
            category: bulkForm.category,
            size: bulkForm.size,
            sizeUnit: bulkForm.sizeUnit,
            price: bulkForm.price,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to bulk create"); return; }
      setShowBulkModal(false);
      setSuccess(data.message);
      setBulkForm({ projectId: "", blockName: "", startNo: "", endNo: "", category: "residential", size: "", sizeUnit: "sqft", price: "" });
      await fetchData();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUnit) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/units/${editUnit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to update"); return; }
      setEditUnit(null);
      setSuccess("Plot updated successfully");
      await fetchData();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, plotNo: string) {
    if (!confirm(`Delete plot ${plotNo}?`)) return;
    try {
      const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to delete"); return; }
      setSuccess("Plot deleted");
      await fetchData();
    } catch { setError("Network error"); }
  }

  function openEdit(u: Unit) {
    setEditForm({ plotNo: u.plotNo, category: u.category, size: String(u.size), sizeUnit: u.sizeUnit, price: String(u.price) });
    setEditUnit(u);
  }

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Plot Inventory</h1>
        <div className="flex gap-2">
          <button onClick={() => { setAddForm({ projectId: filterProject !== "All" ? projects.find(p => p.name === filterProject)?.id || "" : "", blockName: "", plotNo: "", category: "residential", size: "", sizeUnit: "sqft", price: "" }); setShowAddModal(true); }} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted">+ Add Plot</button>
          <button onClick={() => { setBulkForm({ projectId: filterProject !== "All" ? projects.find(p => p.name === filterProject)?.id || "" : "", blockName: "", startNo: "", endNo: "", category: "residential", size: "", sizeUnit: "sqft", price: "" }); setShowBulkModal(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ Bulk Add</button>
        </div>
      </div>

      {error && <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}
      {success && <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 text-sm rounded-md border border-green-200 flex items-center justify-between"><span>{success}</span><button onClick={() => setSuccess("")} className="text-green-500 hover:text-green-700">&times;</button></div>}

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="text-muted-foreground text-sm">Loading plots...</div></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div className="stat-card"><div className="stat-card-value">{stats.total}</div><div className="stat-card-label">Total Plots</div></div>
            <div className="stat-card"><div className="stat-card-value text-green-600">{stats.available}</div><div className="stat-card-label">Available</div></div>
            <div className="stat-card"><div className="stat-card-value text-orange-600">{stats.booked}</div><div className="stat-card-label">Booked</div></div>
            <div className="stat-card"><div className="stat-card-value text-red-600">{stats.sold}</div><div className="stat-card-label">Sold</div></div>
            <div className="stat-card"><div className="stat-card-value text-yellow-600">{stats.hold}</div><div className="stat-card-label">On Hold</div></div>
          </div>

          <div className="flex gap-3 mb-6 flex-wrap">
            <input type="text" placeholder="Search plot number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-60" />
            <select value={filterProject} onChange={(e) => { setFilterProject(e.target.value); setFilterBlock("All"); }} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="All">All Projects</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="All">All Blocks</option>
              {uniqueBlocks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="All">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="sold">Sold</option>
              <option value="hold">Hold</option>
            </select>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Block</th><th>Plot No</th><th>Category</th><th>Size</th><th>Price</th><th>Status</th><th>Project</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No plots found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.block.name}</td>
                    <td className="font-mono text-sm">{u.plotNo}</td>
                    <td className="capitalize text-sm">{u.category}</td>
                    <td className="text-sm">{u.size.toLocaleString()} {u.sizeUnit}</td>
                    <td className="font-medium text-sm">PKR {Number(u.price).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${u.status === 'available' ? 'bg-green-100 text-green-800' : u.status === 'booked' ? 'bg-orange-100 text-orange-800' : u.status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-sm">{u.block.project.name}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="px-2 py-1 text-xs border rounded hover:bg-muted">Edit</button>
                        <button onClick={() => handleDelete(u.id, u.plotNo)} className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Single Plot Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Plot</h2>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleAddSingle} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Project *</label>
                  <select required value={addForm.projectId} onChange={(e) => setAddForm({ ...addForm, projectId: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Block Name *</label>
                  <input required value={addForm.blockName} onChange={(e) => setAddForm({ ...addForm, blockName: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. Block A" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Plot No *</label>
                  <input required value={addForm.plotNo} onChange={(e) => setAddForm({ ...addForm, plotNo: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. 123" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Category</label>
                  <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="shop">Shop</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Size *</label>
                  <input required type="number" min="0" value={addForm.size} onChange={(e) => setAddForm({ ...addForm, size: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. 125" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Unit</label>
                  <select value={addForm.sizeUnit} onChange={(e) => setAddForm({ ...addForm, sizeUnit: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="sqft">sq.ft</option>
                    <option value="sqyd">sq.yd</option>
                    <option value="marla">Marla</option>
                    <option value="kanal">Kanal</option>
                  </select>
                </div>
                <div className="form-group col-span-2">
                  <label className="text-sm font-medium">Price (PKR) *</label>
                  <input required type="number" min="0" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. 5000000" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">{saving ? "Adding..." : "Add Plot"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Bulk Add Plots</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleBulkAdd} className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-md text-sm">
                Creates plots with sequential numbers in one block. Existing plot numbers are skipped.
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Project *</label>
                  <select required value={bulkForm.projectId} onChange={(e) => setBulkForm({ ...bulkForm, projectId: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Block Name *</label>
                  <input required value={bulkForm.blockName} onChange={(e) => setBulkForm({ ...bulkForm, blockName: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g. Block A" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Start Plot No *</label>
                  <input required type="number" min="1" value={bulkForm.startNo} onChange={(e) => setBulkForm({ ...bulkForm, startNo: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="1" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">End Plot No *</label>
                  <input required type="number" min="1" value={bulkForm.endNo} onChange={(e) => setBulkForm({ ...bulkForm, endNo: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="50" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Category</label>
                  <select value={bulkForm.category} onChange={(e) => setBulkForm({ ...bulkForm, category: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Size *</label>
                  <input required type="number" min="0" value={bulkForm.size} onChange={(e) => setBulkForm({ ...bulkForm, size: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="125" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Unit</label>
                  <select value={bulkForm.sizeUnit} onChange={(e) => setBulkForm({ ...bulkForm, sizeUnit: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="sqft">sq.ft</option>
                    <option value="sqyd">sq.yd</option>
                    <option value="marla">Marla</option>
                    <option value="kanal">Kanal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Price per Plot (PKR) *</label>
                  <input required type="number" min="0" value={bulkForm.price} onChange={(e) => setBulkForm({ ...bulkForm, price: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="5000000" />
                </div>
              </div>
              {bulkForm.startNo && bulkForm.endNo && parseInt(bulkForm.endNo) >= parseInt(bulkForm.startNo) && (
                <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
                  Will create {parseInt(bulkForm.endNo) - parseInt(bulkForm.startNo) + 1} plots ({bulkForm.startNo} to {bulkForm.endNo})
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowBulkModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">{saving ? "Creating..." : "Create Plots"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plot Modal */}
      {editUnit && (
        <div className="modal-overlay" onClick={() => setEditUnit(null)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Plot — {editUnit.block.name}-{editUnit.plotNo}</h2>
              <button onClick={() => setEditUnit(null)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Plot No</label>
                  <input value={editForm.plotNo} onChange={(e) => setEditForm({ ...editForm, plotNo: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="shop">Shop</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Size</label>
                  <input type="number" min="0" value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Unit</label>
                  <select value={editForm.sizeUnit} onChange={(e) => setEditForm({ ...editForm, sizeUnit: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="sqft">sq.ft</option>
                    <option value="sqyd">sq.yd</option>
                    <option value="marla">Marla</option>
                    <option value="kanal">Kanal</option>
                  </select>
                </div>
                <div className="form-group col-span-2">
                  <label className="text-sm font-medium">Price (PKR)</label>
                  <input type="number" min="0" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setEditUnit(null)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
