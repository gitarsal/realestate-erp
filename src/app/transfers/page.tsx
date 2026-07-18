"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface Transfer {
  id: string;
  from: string;
  fromClientId: string;
  to: string;
  toClientId: string;
  file: string;
  fileId: string;
  project: string;
  plot: string;
  fee: number;
  date: string;
  status: string;
}

interface ClientOption {
  id: string;
  name: string;
  files: { regNo: string; projectName: string; plotNo: string }[];
}

export default function TransfersPage() {
  const { toast, ToastContainer } = useToast();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTransfer, setViewTransfer] = useState<Transfer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);

  const [form, setForm] = useState({
    fromClientId: "",
    toClientId: "",
    fileId: "",
    fee: "",
    transferDate: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const fetchTransfers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/transfers");
      if (!res.ok) throw new Error("Failed to fetch transfers");
      const data = await res.json();
      const rows: Transfer[] = (data.transfers || []).map((t: any) => ({
        id: t.id,
        from: t.transferor?.name || "—",
        fromClientId: t.fromClientId,
        to: t.transferee?.name || "—",
        toClientId: t.toClientId,
        file: t.file?.regNo || "—",
        fileId: t.fileId,
        project: t.file?.project?.name || "—",
        plot: t.file?.unit?.plotNo || "—",
        fee: t.fee || 0,
        date: t.transferDate ? new Date(t.transferDate).toISOString().split("T")[0] : "—",
        status: t.status || "pending",
      }));
      setTransfers(rows);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
      toast("Failed to load transfers", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?pageSize=200");
      if (res.ok) {
        const data = await res.json();
        const opts: ClientOption[] = (data.clients || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          files: (c.files || []).map((f: any) => ({
            regNo: f.regNo,
            projectName: f.project?.name || "",
            plotNo: f.unit?.plotNo || "",
          })),
        }));
        setClientOptions(opts);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchTransfers();
    fetchClients();
  }, [fetchTransfers, fetchClients]);

  const selectedFromClient = clientOptions.find((c) => c.id === form.fromClientId);
  const availableFiles = selectedFromClient?.files || [];

  async function handleNewTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fileId || !form.fromClientId || !form.toClientId) {
      toast("Please fill all required fields", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: form.fileId,
          fromClientId: form.fromClientId,
          toClientId: form.toClientId,
          fee: form.fee ? Number(form.fee) : undefined,
          transferDate: form.transferDate || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create transfer");
      }

      toast("Transfer submitted for approval", "success");
      setForm({ fromClientId: "", toClientId: "", fileId: "", fee: "", transferDate: "" });
      setShowModal(false);
      fetchTransfers();
    } catch (e: any) {
      toast(e.message || "Failed to create transfer", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/transfers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to approve transfer");
      }

      toast("Transfer approved", "success");
      fetchTransfers();
    } catch (e: any) {
      toast(e.message || "Failed to approve transfer", "error");
    }
  }

  async function handleReject(id: string) {
    try {
      const res = await fetch(`/api/transfers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reject transfer");
      }

      toast("Transfer rejected", "success");
      fetchTransfers();
    } catch (e: any) {
      toast(e.message || "Failed to reject transfer", "error");
    }
  }

  const stats = {
    total: transfers.length,
    approved: transfers.filter((t) => t.status === "approved").length,
    pending: transfers.filter((t) => t.status === "pending").length,
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">File Transfers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          + New Transfer
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground text-sm">Loading transfers...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-card-value text-blue-600">{stats.total}</div>
              <div className="stat-card-label">Total Transfers</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-green-600">{stats.approved}</div>
              <div className="stat-card-label">Approved</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-orange-600">{stats.pending}</div>
              <div className="stat-card-label">Pending Approval</div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>From</th>
                  <th>To</th>
                  <th>File</th>
                  <th>Project</th>
                  <th>Plot</th>
                  <th>Fee</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-muted-foreground text-sm">No transfers found</td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-sm">{t.id.slice(0, 8)}...</td>
                      <td className="font-medium">{t.from}</td>
                      <td className="font-medium">{t.to}</td>
                      <td className="font-mono text-sm">{t.file}</td>
                      <td>{t.project}</td>
                      <td>{t.plot}</td>
                      <td className="font-medium">PKR {t.fee.toLocaleString()}</td>
                      <td className="text-muted-foreground">{t.date}</td>
                      <td>
                        <span className={`status-badge ${
                          t.status === 'approved' ? 'bg-green-100 text-green-800' :
                          t.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>{t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
                      </td>
                      <td>
                        {t.status === 'pending' ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleApprove(t.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Approve</button>
                            <button onClick={() => handleReject(t.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Reject</button>
                          </div>
                        ) : (
                          <button onClick={() => { setViewTransfer(t); setShowViewModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* View Transfer Modal */}
      {showViewModal && viewTransfer && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Transfer Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Transfer ID</label>
                  <p className="font-mono text-sm font-medium">{viewTransfer.id}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <p>
                    <span className={`status-badge ${
                      viewTransfer.status === 'approved' ? 'bg-green-100 text-green-800' :
                      viewTransfer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>{viewTransfer.status.charAt(0).toUpperCase() + viewTransfer.status.slice(1)}</span>
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <p className="font-medium">{viewTransfer.from}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <p className="font-medium">{viewTransfer.to}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">File</label>
                  <p className="font-mono text-sm">{viewTransfer.file}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Project</label>
                  <p className="font-medium">{viewTransfer.project}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Plot</label>
                  <p className="font-medium">{viewTransfer.plot}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fee</label>
                  <p className="font-medium">PKR {viewTransfer.fee.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Date</label>
                  <p className="font-medium">{viewTransfer.date}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* New Transfer Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New File Transfer</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <form onSubmit={handleNewTransfer} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">From Client *</label>
                  <select required value={form.fromClientId} onChange={(e) => updateField("fromClientId", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full">
                    <option value="">Select Client</option>
                    {clientOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">To Client *</label>
                  <select required value={form.toClientId} onChange={(e) => updateField("toClientId", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full">
                    <option value="">Select Client</option>
                    {clientOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">File Number *</label>
                  <select required value={form.fileId} onChange={(e) => updateField("fileId", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full">
                    <option value="">Select File</option>
                    {availableFiles.map((f) => (
                      <option key={f.regNo} value={f.regNo}>{f.regNo}{f.projectName ? ` - ${f.projectName}` : ""}{f.plotNo ? `, ${f.plotNo}` : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Transfer Fee (PKR)</label>
                  <input type="number" value={form.fee} onChange={(e) => updateField("fee", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="150000" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Transfer Date</label>
                  <input type="date" value={form.transferDate} onChange={(e) => updateField("transferDate", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit for Approval"}
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
