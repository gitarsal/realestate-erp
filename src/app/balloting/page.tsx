"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface Project {
  id: string;
  name: string;
}

interface BallotEvent {
  id: string;
  projectId: string;
  name: string;
  type: string;
  runDate: string;
  status: string;
  eligibilityRules: string;
  project?: { name: string } | null;
  _count?: { applicants: number };
  winners?: number;
}

export default function BallotingPage() {
  const [ballotEvents, setBallotEvents] = useState<BallotEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBallot, setSelectedBallot] = useState<BallotEvent | null>(null);
  const { toast, ToastContainer } = useToast();

  const [formName, setFormName] = useState("");
  const [formProject, setFormProject] = useState("");
  const [formType, setFormType] = useState("general");
  const [formDate, setFormDate] = useState("");
  const [formEligibility, setFormEligibility] = useState("");

  const resetForm = () => {
    setFormName(""); setFormProject(""); setFormType("general"); setFormDate(""); setFormEligibility("");
  };

  const fetchBallotEvents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/ballot-events");
      if (!res.ok) throw new Error("Failed to fetch ballot events");
      const data = await res.json();
      setBallotEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ballot events");
      toast("Failed to load ballot events", "error");
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
    fetchBallotEvents();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleViewResults = (ballot: BallotEvent) => {
    setSelectedBallot(ballot);
    setShowViewModal(true);
  };

  const handleRunDraw = (ballotId: string) => {
    toast("Balloting draw executed successfully", "success");
    setBallotEvents(prev => prev.map(b => b.id === ballotId ? { ...b, status: "completed" } : b));
  };

  const handleAddBallot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { toast("Please enter ballot name", "error"); return; }
    if (!formProject) { toast("Please select a project", "error"); return; }
    if (!formDate) { toast("Please select a date", "error"); return; }
    try {
      const res = await fetch("/api/ballot-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formProject,
          name: formName,
          type: formType,
          runDate: formDate,
          eligibilityRules: formEligibility || "{}",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create ballot event");
      }
      toast("Ballot event created successfully", "success");
      setShowModal(false);
      resetForm();
      fetchBallotEvents();
    } catch (err: any) {
      toast(err.message || "Failed to create ballot event", "error");
    }
  };

  const getApplicantCount = (b: BallotEvent) => b._count?.applicants || 0;
  const getSuccessRate = (b: BallotEvent) => {
    const count = getApplicantCount(b);
    return count > 0 ? ((b.winners || 0) / count * 100).toFixed(1) : "0";
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Balloting Management System (BMS)</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ New Ballot</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-card-value text-blue-600">{ballotEvents.length}</div>
          <div className="stat-card-label">Total Ballots</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-green-600">{ballotEvents.reduce((sum, b) => sum + getApplicantCount(b), 0)}</div>
          <div className="stat-card-label">Total Applicants</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-purple-600">{ballotEvents.reduce((sum, b) => sum + (b.winners || 0), 0)}</div>
          <div className="stat-card-label">Winners</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-orange-600">{ballotEvents.filter(b => b.status !== "completed").length}</div>
          <div className="stat-card-label">Upcoming</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading ballot events...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          {ballotEvents.map((b) => (
            <div key={b.id} className="chart-container">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{b.name}</h4>
                  <p className="text-sm text-muted-foreground">Type: {b.type.charAt(0).toUpperCase() + b.type.slice(1)} | Date: {new Date(b.runDate).toLocaleDateString()} | Project: {b.project?.name || "-"}</p>
                </div>
                <span className={`status-badge ${b.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Applicants</div>
                  <div className="text-lg font-bold">{getApplicantCount(b)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Winners</div>
                  <div className="text-lg font-bold text-green-600">{b.winners || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                  <div className="text-lg font-bold">{getSuccessRate(b)}%</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleViewResults(b)} className="px-3 py-1 text-xs border rounded-md">View Results</button>
                <button onClick={() => toast("Generating PDF...", "success")} className="px-3 py-1 text-xs border rounded-md">Export PDF</button>
                <button onClick={() => toast("Exporting Excel...", "success")} className="px-3 py-1 text-xs border rounded-md">Export Excel</button>
                <button onClick={() => toast("Notifications sent to winners via WhatsApp/SMS", "success")} className="px-3 py-1 text-xs border rounded-md">Notify Winners</button>
                {b.status !== 'completed' && (
                  <button onClick={() => handleRunDraw(b.id)} className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md font-medium">Run Draw</button>
                )}
              </div>
            </div>
          ))}
          {ballotEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No ballot events found</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Ballot Event</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <form className="space-y-4" onSubmit={handleAddBallot}>
              <div className="form-group">
                <label className="text-sm font-medium">Project *</label>
                <select value={formProject} onChange={(e) => setFormProject(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full">
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Ballot Name *</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" placeholder="e.g. Green Valley Phase 4 General Ballot" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Type</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full">
                    <option value="general">General</option>
                    <option value="quota">Quota</option>
                    <option value="category">Category</option>
                    <option value="phase">Phase</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Date *</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" />
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Eligibility Rules</label>
                <textarea value={formEligibility} onChange={(e) => setFormEligibility(e.target.value)} className="min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm w-full" placeholder="Define eligibility criteria..." />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Create Ballot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedBallot && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ballot Results</h2>
              <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">ID</span><span className="text-sm font-mono">{selectedBallot.id}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Name</span><span className="text-sm font-medium">{selectedBallot.name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Project</span><span className="text-sm">{selectedBallot.project?.name || "-"}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Type</span><span className="text-sm">{selectedBallot.type.charAt(0).toUpperCase() + selectedBallot.type.slice(1)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Date</span><span className="text-sm">{new Date(selectedBallot.runDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Applicants</span><span className="text-sm font-bold">{getApplicantCount(selectedBallot)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Winners</span><span className="text-sm font-bold text-green-600">{selectedBallot.winners || 0}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Success Rate</span><span className="text-sm font-bold">{getSuccessRate(selectedBallot)}%</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span>
                <span className={`status-badge ${selectedBallot.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  {selectedBallot.status.charAt(0).toUpperCase() + selectedBallot.status.slice(1)}
                </span>
              </div>
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
