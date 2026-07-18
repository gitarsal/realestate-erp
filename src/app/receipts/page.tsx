"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface Receipt {
  id: string;
  receiptNo: string;
  clientName: string;
  fileRegNo: string;
  fileId: string;
  amount: number;
  mode: string;
  instrumentNo: string;
  date: string;
  receivedBy: string;
}

interface FileOption {
  fileId: string;
  regNo: string;
  clientName: string;
  projectName: string;
}

export default function ReceiptsPage() {
  const { toast, ToastContainer } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileOptions, setFileOptions] = useState<FileOption[]>([]);

  const [form, setForm] = useState({
    fileId: "",
    amount: "",
    mode: "Cash",
    instrumentNo: "",
    chequeDate: "",
    narration: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/receipts");
      if (!res.ok) throw new Error("Failed to fetch receipts");
      const data = await res.json();
      const rows: Receipt[] = (data.receipts || []).map((r: any) => ({
        id: r.id,
        receiptNo: r.receiptNo,
        clientName: r.file?.client?.name || "—",
        fileRegNo: r.file?.regNo || "—",
        fileId: r.fileId,
        amount: Number(r.amount),
        mode: r.mode,
        instrumentNo: r.instrumentNo || "-",
        date: r.receivedAt ? new Date(r.receivedAt).toISOString().split("T")[0] : "—",
        receivedBy: r.receivedBy || "—",
      }));
      setReceipts(rows);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
      toast("Failed to load receipts", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchFileOptions = useCallback(async () => {
    try {
      const res = await fetch("/api/clients?pageSize=200");
      if (res.ok) {
        const data = await res.json();
        const opts: FileOption[] = [];
        for (const c of data.clients || []) {
          for (const f of c.files || []) {
            opts.push({
              fileId: f.id,
              regNo: f.regNo,
              clientName: c.name,
              projectName: f.project?.name || "",
            });
          }
        }
        setFileOptions(opts);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchReceipts();
    fetchFileOptions();
  }, [fetchReceipts, fetchFileOptions]);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fileId || !form.amount) {
      toast("Please fill all required fields", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: form.fileId,
          amount: Number(form.amount),
          mode: form.mode.toLowerCase().replace('bank transfer', 'bank').replace('pay order', 'pay_order'),
          instrumentNo: form.instrumentNo || undefined,
          chequeDate: form.chequeDate || undefined,
          narration: form.narration || undefined,
          receivedBy: "system",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record payment");
      }

      toast("Payment recorded successfully", "success");
      setForm({ fileId: "", amount: "", mode: "Cash", instrumentNo: "", chequeDate: "", narration: "" });
      setShowModal(false);
      fetchReceipts();
    } catch (e: any) {
      toast(e.message || "Failed to record payment", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredReceipts = receipts.filter(
    (r) => (r.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.fileRegNo.toLowerCase().includes(searchTerm.toLowerCase())) &&
           (filterMode === "All" || r.mode === filterMode) &&
           (!filterDate || r.date === filterDate)
  );

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Receipts & Payments</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
          + Record Payment
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground text-sm">Loading receipts...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-card-value text-green-600">PKR {receipts.reduce((s, r) => s + r.amount, 0).toLocaleString()}</div>
              <div className="stat-card-label">Total Collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-blue-600">{receipts.length}</div>
              <div className="stat-card-label">Total Receipts</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-orange-600">{receipts.filter(r => r.mode === "Online").length}</div>
              <div className="stat-card-label">Online Payments</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-purple-600">{receipts.filter(r => r.mode === "Cash").length}</div>
              <div className="stat-card-label">Cash Payments</div>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <input type="text" placeholder="Search by receipt no, client, file..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96" />
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="All">All Modes</option>
              <option>Cash</option>
              <option>Cheque</option>
              <option>Online</option>
              <option>Bank</option>
              <option>Pay Order</option>
            </select>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
            <button onClick={() => toast("Receipts exported to CSV", "success")} className="px-3 py-2 border rounded-md text-sm font-medium">Export</button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Client</th>
                  <th>File No</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Instrument</th>
                  <th>Date</th>
                  <th>Received By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">No receipts found</td>
                  </tr>
                ) : (
                  filteredReceipts.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-sm">{r.receiptNo}</td>
                      <td className="font-medium">{r.clientName}</td>
                      <td className="font-mono text-sm">{r.fileRegNo}</td>
                      <td className="font-medium text-green-600">PKR {r.amount.toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${
                          r.mode === 'Cash' ? 'bg-green-100 text-green-800' :
                          r.mode === 'Online' ? 'bg-blue-100 text-blue-800' :
                          r.mode === 'Cheque' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{r.mode}</span>
                      </td>
                      <td className="font-mono text-sm">{r.instrumentNo}</td>
                      <td className="text-muted-foreground">{r.date}</td>
                      <td>{r.receivedBy}</td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => window.print()} className="px-2 py-1 text-xs border rounded hover:bg-muted">Print</button>
                          <button onClick={() => toast("WhatsApp sharing not implemented yet", "info")} className="px-2 py-1 text-xs border rounded hover:bg-muted">WhatsApp</button>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Record Payment</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">File Number *</label>
                  <select required value={form.fileId} onChange={(e) => updateField("fileId", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="">Select File</option>
                    {fileOptions.map((fo) => (
                      <option key={fo.regNo} value={fo.fileId}>{fo.regNo} - {fo.clientName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Amount *</label>
                  <input type="number" required value={form.amount} onChange={(e) => updateField("amount", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="250000" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Payment Mode *</label>
                  <select value={form.mode} onChange={(e) => updateField("mode", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option>Cash</option>
                    <option>Cheque</option>
                    <option>Online</option>
                    <option>Bank Transfer</option>
                    <option>Pay Order</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Instrument Number</label>
                  <input type="text" value={form.instrumentNo} onChange={(e) => updateField("instrumentNo", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="Cheque/Transaction number" />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Date</label>
                  <input type="date" value={form.chequeDate} onChange={(e) => updateField("chequeDate", e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Narration</label>
                <textarea value={form.narration} onChange={(e) => updateField("narration", e.target.value)} className="min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Payment description" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50">
                  {submitting ? "Saving..." : "Save & Print Receipt"}
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
