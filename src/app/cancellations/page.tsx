"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface Cancellation {
  id: string;
  client: string;
  file: string;
  project: string;
  plot: string;
  reason: string;
  date: string;
  refundable: number;
  paid: number;
  deductions: number;
  status: string;
  cancelledBy: string;
}

interface FileOption {
  fileId: string;
  regNo: string;
  clientName: string;
  projectName: string;
  paid: number;
}

export default function CancellationsPage() {
  const { toast, ToastContainer } = useToast();
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCancellation, setViewCancellation] = useState<Cancellation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileOptions, setFileOptions] = useState<FileOption[]>([]);

  const [form, setForm] = useState({
    fileId: "",
    reason: "",
    reasonDetails: "",
    cancelledBy: "",
    deductionPercent: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const fetchCancellations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/cancellations");
      if (!res.ok) throw new Error("Failed to fetch cancellations");
      const data = await res.json();
      const rows: Cancellation[] = (data.cancellations || []).map((c: any) => ({
        id: c.id,
        client: c.file?.client?.name || "—",
        file: c.file?.regNo || "—",
        project: c.file?.project?.name || "—",
        plot: c.file?.unit?.plotNo || "—",
        reason: c.reason || "—",
        date: c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "—",
        refundable: Number(c.refundableAmount) || 0,
        paid: Number(c.paidAmount) || 0,
        deductions: Number(c.deductions) || 0,
        status: c.status || "pending",
        cancelledBy: c.cancelledBy || "—",
      }));
      setCancellations(rows);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
      toast("Failed to load cancellations", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchFileOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        const opts: FileOption[] = (data.bookings || []).map((b: any) => ({
          fileId: b.id,
          regNo: b.regNo,
          clientName: b.clientName,
          projectName: b.projectName,
          paid: b.totalPaid || 0,
        }));
        setFileOptions(opts);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchCancellations();
    fetchFileOptions();
  }, [fetchCancellations, fetchFileOptions]);

  async function handleProcessCancellation() {
    if (!form.fileId || !form.reason) {
      toast("Please select a file and enter a reason", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: form.fileId,
          reason: form.reasonDetails || form.reason,
          cancelledBy: form.cancelledBy || "system",
          deductionPercent: form.deductionPercent || "0",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process cancellation");
      }

      toast("Cancellation processed successfully", "success");
      setForm({ fileId: "", reason: "", reasonDetails: "", cancelledBy: "", deductionPercent: "" });
      setShowModal(false);
      fetchCancellations();
    } catch (e: any) {
      toast(e.message || "Failed to process cancellation", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStatus(cancellationId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/cancellations/${cancellationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast(`Cancellation ${newStatus} successfully`, "success");
      fetchCancellations();
    } catch (e: any) {
      toast(e.message || "Failed to update", "error");
    }
  }

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Cancellations & Refunds</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium" onClick={() => setShowModal(true)}>+ Process Cancellation</button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground text-sm">Loading cancellations...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-card-value text-red-600">{cancellations.length}</div>
              <div className="stat-card-label">Total Cancellations</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-orange-600">{cancellations.filter((c) => c.status === "pending").length}</div>
              <div className="stat-card-label">Pending Refunds</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-green-600">PKR {cancellations.filter((c) => c.status === "completed" || c.status === "refunded").reduce((s, c) => s + c.refundable, 0).toLocaleString()}</div>
              <div className="stat-card-label">Total Refunded</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-purple-600">PKR {cancellations.reduce((s, c) => s + c.deductions, 0).toLocaleString()}</div>
              <div className="stat-card-label">Deductions Applied</div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client</th>
                  <th>File</th>
                  <th>Project</th>
                  <th>Plot</th>
                  <th>Reason</th>
                  <th>Paid</th>
                  <th>Deductions</th>
                  <th>Refundable</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cancellations.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-8 text-muted-foreground text-sm">No cancellations found</td>
                  </tr>
                ) : (
                  cancellations.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono text-sm">{c.id.slice(0, 8)}...</td>
                      <td className="font-medium">{c.client}</td>
                      <td className="font-mono text-sm">{c.file}</td>
                      <td>{c.project}</td>
                      <td>{c.plot}</td>
                      <td className="max-w-[200px] truncate text-sm">{c.reason}</td>
                      <td>PKR {c.paid.toLocaleString()}</td>
                      <td className="text-red-600">PKR {c.deductions.toLocaleString()}</td>
                      <td className="font-medium text-green-600">PKR {c.refundable.toLocaleString()}</td>
                      <td className="text-muted-foreground">{c.date}</td>
                      <td>
                        <span className={`status-badge ${
                          c.status === 'completed' ? 'bg-green-100 text-green-800' :
                          c.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {c.status === 'pending' && (
                            <>
                              <button onClick={() => handleUpdateStatus(c.id, 'approved')} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                              <button onClick={() => handleUpdateStatus(c.id, 'rejected')} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                            </>
                          )}
                          {c.status === 'approved' && (
                            <button onClick={() => handleUpdateStatus(c.id, 'refunded')} className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">Process Refund</button>
                          )}
                          <button className="px-2 py-1 text-xs border rounded hover:bg-muted" onClick={() => { setViewCancellation(c); setShowViewModal(true); }}>View</button>
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

      {/* View Cancellation Modal */}
      {showViewModal && viewCancellation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Cancellation Details</h2>
                <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Cancellation ID</label>
                    <p className="font-mono text-sm font-medium">{viewCancellation.id}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Status</label>
                    <p>
                      <span className={`status-badge ${
                        viewCancellation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        viewCancellation.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{viewCancellation.status.charAt(0).toUpperCase() + viewCancellation.status.slice(1)}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Client</label>
                    <p className="font-medium">{viewCancellation.client}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">File</label>
                    <p className="font-mono text-sm">{viewCancellation.file}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Project</label>
                    <p className="font-medium">{viewCancellation.project}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Plot</label>
                    <p className="font-medium">{viewCancellation.plot}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Paid</label>
                    <p className="font-medium">PKR {viewCancellation.paid.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Deductions</label>
                    <p className="text-red-600 font-medium">PKR {viewCancellation.deductions.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Refundable</label>
                    <p className="font-medium text-green-600">PKR {viewCancellation.refundable.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Date</label>
                    <p className="font-medium">{viewCancellation.date}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Reason</label>
                  <p className="text-sm">{viewCancellation.reason}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cancelled By</label>
                  <p className="text-sm font-medium">{viewCancellation.cancelledBy}</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted">Close</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Process Cancellation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">File Number *</label>
                  <select value={form.fileId} onChange={(e) => updateField("fileId", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="">Select file number</option>
                    {fileOptions.map((fo) => (
                      <option key={fo.fileId} value={fo.fileId}>{fo.regNo} - {fo.clientName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cancellation Reason *</label>
                  <select value={form.reason} onChange={(e) => updateField("reason", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="">Select reason</option>
                    <option value="Non-payment">Non-payment</option>
                    <option value="Client request">Client request</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reason Details</label>
                  <textarea value={form.reasonDetails} onChange={(e) => updateField("reasonDetails", e.target.value)} rows={4} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Provide details about the cancellation..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cancelled By</label>
                  <input type="text" value={form.cancelledBy} onChange={(e) => updateField("cancelledBy", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Enter name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cancellation Penalty (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={form.deductionPercent} onChange={(e) => updateField("deductionPercent", e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. 10" />
                  <p className="text-xs text-muted-foreground mt-1">Percentage of paid amount to deduct</p>
                </div>
                {form.fileId && (() => {
                  const paid = fileOptions.find(f => f.fileId === form.fileId)?.paid || 0;
                  const pct = parseFloat(form.deductionPercent) || 0;
                  const dedAmount = Math.round(paid * pct / 100);
                  const refundable = paid - dedAmount;
                  return (
                    <div className="p-3 bg-muted/50 rounded-md text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-muted-foreground">Total Paid:</span><span className="font-medium">PKR {paid.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Penalty ({pct}%):</span><span className="text-red-600">PKR {dedAmount.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t pt-1"><span className="font-medium">Refundable:</span><span className="font-medium text-green-600">PKR {refundable.toLocaleString()}</span></div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={handleProcessCancellation} disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
                {submitting ? "Processing..." : "Process Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </AppShell>
  );
}
