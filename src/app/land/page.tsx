"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface Project {
  id: string;
  name: string;
}

interface LandRecord {
  id: string;
  projectId: string | null;
  moza: string;
  khasraNo: string;
  khewatNo: string;
  khatooniNo: string;
  ownerName: string;
  caseType: string;
  status: string;
  area: string | number | null;
  areaUnit: string;
  project?: { name: string } | null;
}

export default function LandPage() {
  const { toast, ToastContainer } = useToast();
  const [landRecords, setLandRecords] = useState<LandRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LandRecord | null>(null);
  const [activeTab, setActiveTab] = useState("Record Cases");
  const [filterCaseType, setFilterCaseType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const [formProjectId, setFormProjectId] = useState("");
  const [moza, setMoza] = useState("");
  const [khasra, setKhasra] = useState("");
  const [khewat, setKhewat] = useState("");
  const [khatooni, setKhatooni] = useState("");
  const [owner, setOwner] = useState("");
  const [caseType, setCaseType] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("kanal");

  const tabs = ["Record Cases", "Acquisition Cases", "Sale Cases", "Virasat Cases"];

  const fetchLandRecords = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filterSearch) params.set("search", filterSearch);
      if (filterCaseType) params.set("caseType", filterCaseType);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/land-records?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch land records");
      const data = await res.json();
      setLandRecords(data);
    } catch (err: any) {
      setError(err.message || "Failed to load land records");
      toast("Failed to load land records", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      toast("Failed to load projects", "error");
    }
  };

  useEffect(() => {
    fetchLandRecords();
  }, [filterSearch, filterCaseType, filterStatus]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredRecords = landRecords.filter((lr) => {
    if (activeTab !== "Record Cases") {
      const tabType = activeTab.replace(" Cases", "").toLowerCase();
      if (lr.caseType !== tabType) return false;
    }
    return true;
  });

  const stats = {
    totalMozas: [...new Set(landRecords.map(lr => lr.moza))].length,
    totalArea: landRecords.reduce((sum, lr) => sum + (Number(lr.area) || 0), 0),
    activeCases: landRecords.filter(lr => lr.status === "active").length,
    pendingTransfers: landRecords.filter(lr => lr.status === "transferred").length,
  };

  const resetForm = () => {
    setFormProjectId(""); setMoza(""); setKhasra(""); setKhewat(""); setKhatooni(""); setOwner(""); setCaseType(""); setArea(""); setAreaUnit("kanal");
  };

  const handleAddRecord = async () => {
    if (!moza.trim()) { toast("Please enter moza name", "error"); return; }
    try {
      const res = await fetch("/api/land-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formProjectId || undefined,
          moza,
          khasraNo: khasra,
          khewatNo: khewat,
          khatooniNo: khatooni,
          ownerName: owner,
          caseType: caseType || "record",
          area: area ? parseFloat(area) : undefined,
          areaUnit,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add land record");
      }
      toast("Land record added successfully", "success");
      setShowModal(false);
      resetForm();
      fetchLandRecords();
    } catch (err: any) {
      toast(err.message || "Failed to add land record", "error");
    }
  };

  const handleViewRecord = (record: LandRecord) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Land Management System (LMS)</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium" onClick={() => setShowModal(true)}>+ Add Record</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-card-value text-blue-600">{stats.totalMozas}</div>
          <div className="stat-card-label">Total Mozas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-green-600">{stats.totalArea.toLocaleString()}</div>
          <div className="stat-card-label">Total Area (Kanal)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-orange-600">{stats.activeCases}</div>
          <div className="stat-card-label">Active Cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-purple-600">{stats.pendingTransfers}</div>
          <div className="stat-card-label">Pending Transfers</div>
        </div>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder="Search by owner name or khasra no..." className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm flex-1" />
        <select value={filterCaseType} onChange={(e) => setFilterCaseType(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value="">All Case Types</option>
          <option value="record">Record</option>
          <option value="acquisition">Acquisition</option>
          <option value="sale">Sale</option>
          <option value="virasat">Virasat</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="transferred">Transferred</option>
          <option value="acquired">Acquired</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading land records...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Moza</th>
                <th>Khasra No</th>
                <th>Khewat No</th>
                <th>Khatooni No</th>
                <th>Owner</th>
                <th>Case Type</th>
                <th>Area</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((lr) => (
                <tr key={lr.id}>
                  <td className="text-sm">{lr.project?.name || "-"}</td>
                  <td className="font-medium">{lr.moza}</td>
                  <td className="font-mono text-sm">{lr.khasraNo}</td>
                  <td>{lr.khewatNo}</td>
                  <td>{lr.khatooniNo}</td>
                  <td>{lr.ownerName}</td>
                  <td>
                    <span className="status-badge bg-gray-100 text-gray-800">{lr.caseType.charAt(0).toUpperCase() + lr.caseType.slice(1)}</span>
                  </td>
                  <td>{lr.area ? `${lr.area} ${lr.areaUnit}` : "-"}</td>
                  <td>
                    <span className="status-badge bg-green-100 text-green-800">{lr.status.charAt(0).toUpperCase() + lr.status.slice(1)}</span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="px-2 py-1 text-xs border rounded hover:bg-muted" onClick={() => handleViewRecord(lr)}>View</button>
                      <button className="px-2 py-1 text-xs border rounded hover:bg-muted" onClick={() => toast("Opening attached documents", "info")}>Documents</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">No land records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Add Land Record</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project</label>
                  <select value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="">Select project (optional)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Moza</label>
                  <input type="text" value={moza} onChange={(e) => setMoza(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Enter moza name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Khasra No</label>
                    <input type="text" value={khasra} onChange={(e) => setKhasra(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. KR-123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Khewat No</label>
                    <input type="text" value={khewat} onChange={(e) => setKhewat(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. KW-45" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Khatooni No</label>
                    <input type="text" value={khatooni} onChange={(e) => setKhatooni(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. KT-67" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Owner Name</label>
                    <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Enter owner name" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Case Type</label>
                    <select value={caseType} onChange={(e) => setCaseType(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">Select case type</option>
                      <option value="record">Record</option>
                      <option value="acquisition">Acquisition</option>
                      <option value="sale">Sale</option>
                      <option value="virasat">Virasat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Area</label>
                    <input type="number" value={area} onChange={(e) => setArea(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. 50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <select value={areaUnit} onChange={(e) => setAreaUnit(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="kanal">Kanal</option>
                      <option value="marla">Marla</option>
                      <option value="acre">Acre</option>
                      <option value="sqft">Sq Ft</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleAddRecord} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Add Record</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Land Record Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">ID</span><span className="text-sm font-mono">{selectedRecord.id}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Project</span><span className="text-sm font-medium">{selectedRecord.project?.name || "-"}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Moza</span><span className="text-sm font-medium">{selectedRecord.moza}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Khasra No</span><span className="text-sm">{selectedRecord.khasraNo}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Khewat No</span><span className="text-sm">{selectedRecord.khewatNo}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Khatooni No</span><span className="text-sm">{selectedRecord.khatooniNo}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Owner</span><span className="text-sm">{selectedRecord.ownerName}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Case Type</span><span className="text-sm">{selectedRecord.caseType.charAt(0).toUpperCase() + selectedRecord.caseType.slice(1)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Area</span><span className="text-sm">{selectedRecord.area ? `${selectedRecord.area} ${selectedRecord.areaUnit}` : "-"}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span>
                  <span className="status-badge bg-green-100 text-green-800">{selectedRecord.status.charAt(0).toUpperCase() + selectedRecord.status.slice(1)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </AppShell>
  );
}
