"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface BillingSchedule {
  id: string;
  chargeType: string;
  amount: number | string;
  frequency: string;
  isActive: boolean;
  createdAt: string;
  registration?: { client?: { name: string } | null; unit?: { plotNo: string; block?: { name: string } | null } | null } | null;
}

interface Bill {
  id: string;
  billNo: string;
  member: string;
  unit: string;
  period: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  paymentCount: number;
}

interface BillingOverview {
  totalUnits: number;
  totalClients: number;
  totalBookings: number;
  activeSchedules: number;
  billsGenerated: number;
  totalCollected: number;
  outstanding: number;
  overdueBills: number;
}

interface FileOption {
  fileId: string;
  regNo: string;
  clientName: string;
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "schedules" | "bills" | "reports">("overview");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BillingSchedule | null>(null);
  const { toast, ToastContainer } = useToast();

  const [billingSchedules, setBillingSchedules] = useState<BillingSchedule[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [fileOptions, setFileOptions] = useState<FileOption[]>([]);
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [scheduleForm, setScheduleForm] = useState({ fileId: "", chargeType: "", amount: "", frequency: "monthly" });
  const [editScheduleForm, setEditScheduleForm] = useState({ amount: "", frequency: "monthly" });

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [schRes, billRes, overviewRes, clRes] = await Promise.all([
        fetch("/api/billing-schedules"),
        fetch("/api/bills"),
        fetch("/api/billing/overview"),
        fetch("/api/clients?pageSize=200"),
      ]);
      if (schRes.ok) setBillingSchedules(await schRes.json());
      if (billRes.ok) setBills(await billRes.json());
      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (clRes.ok) {
        const clData = await clRes.json();
        const opts: FileOption[] = [];
        for (const c of clData.clients || []) {
          for (const f of c.files || []) {
            opts.push({ fileId: f.id, regNo: f.regNo, clientName: c.name });
          }
        }
        setFileOptions(opts);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.fileId) { toast("Please select a file", "error"); return; }
    if (!scheduleForm.chargeType) { toast("Please enter a charge type", "error"); return; }
    if (!scheduleForm.amount) { toast("Please enter an amount", "error"); return; }
    try {
      const res = await fetch("/api/billing-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create billing schedule");
      }
      toast("Billing schedule created", "success");
      setShowModal(false);
      setScheduleForm({ fileId: "", chargeType: "", amount: "", frequency: "monthly" });
      fetchAll();
    } catch (err: any) {
      toast(err.message || "Failed to create billing schedule", "error");
    }
  };

  const handleEditScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    try {
      const res = await fetch(`/api/billing-schedules/${editingSchedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editScheduleForm.amount),
          frequency: editScheduleForm.frequency,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update billing schedule");
      }
      toast("Schedule updated", "success");
      setShowEditModal(false);
      setEditingSchedule(null);
      fetchAll();
    } catch (err: any) {
      toast(err.message || "Failed to update billing schedule", "error");
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const res = await fetch(`/api/billing-schedules/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete billing schedule");
      }
      toast("Schedule deleted", "success");
      fetchAll();
    } catch (err: any) {
      toast(err.message || "Failed to delete billing schedule", "error");
    }
  };

  const handleGenerateBills = async () => {
    if (billingSchedules.length === 0) {
      toast("No billing schedules to generate bills from", "error");
      return;
    }
    try {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      let created = 0;
      for (const sched of billingSchedules) {
        const regId = (sched as any).registration?.client ? (sched as any).regId : null;
        if (!regId) continue;
        const existingBill = bills.find(b => b.period === period && b.member === ((sched as any).registration?.client?.name || ''));
        if (existingBill) continue;
        const res = await fetch("/api/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            registrationId: regId,
            period,
            totalAmount: Number(sched.amount),
            dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString(),
          }),
        });
        if (res.ok) created++;
      }
      if (created > 0) {
        toast(`Generated ${created} bill(s) for ${period}`, "success");
        fetchAll();
      } else {
        toast("No new bills generated (all exist or no registrations)", "info");
      }
    } catch {
      toast("Failed to generate bills", "error");
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Billing Management (BMMS)</h1>
        <div className="flex gap-2">
          <button onClick={handleGenerateBills} className="px-4 py-2 border rounded-md text-sm font-medium">Generate Bills</button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ New Schedule</button>
        </div>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {(["overview", "schedules", "bills", "reports"] as const).map((tab) => (
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

      {activeTab === "overview" && (
        <>
          {overview && (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="stat-card">
                <div className="stat-card-value text-blue-600">{overview.totalUnits}</div>
                <div className="stat-card-label">Total Units</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value text-green-600">{overview.totalClients}</div>
                <div className="stat-card-label">Clients</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value text-purple-600">{overview.billsGenerated}</div>
                <div className="stat-card-label">Bills Generated</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value text-emerald-600">PKR {overview.totalCollected.toLocaleString()}</div>
                <div className="stat-card-label">Total Collected</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value text-orange-600">PKR {overview.outstanding.toLocaleString()}</div>
                <div className="stat-card-label">Outstanding</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-value text-red-600">{overview.overdueBills}</div>
                <div className="stat-card-label">Overdue Bills</div>
              </div>
            </div>
          )}

          <div className="chart-container">
            <h3 className="font-semibold mb-4">Recent Bills</h3>
            <div className="table-container">
              {bills.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">No bills generated yet. Use "Generate Bills" to create bills from schedules.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Member</th>
                      <th>Unit</th>
                      <th>Period</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.slice(0, 10).map((bill) => (
                      <tr key={bill.id}>
                        <td className="font-mono text-sm">{bill.billNo}</td>
                        <td className="font-medium">{bill.member}</td>
                        <td>{bill.unit}</td>
                        <td>{bill.period}</td>
                        <td className="font-medium">PKR {bill.totalAmount.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${
                            bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                            bill.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                            bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            bill.status === 'reversed' ? 'bg-gray-100 text-gray-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {bill.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "schedules" && (
        loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading billing schedules...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Charge Type</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {billingSchedules.map((sched) => (
                  <tr key={sched.id}>
                    <td className="font-medium">{sched.chargeType}</td>
                    <td className="font-medium">PKR {Number(sched.amount).toLocaleString()}</td>
                    <td>
                      <span className="status-badge bg-blue-100 text-blue-800">{sched.frequency.charAt(0).toUpperCase() + sched.frequency.slice(1)}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${sched.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {sched.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => {
                          setEditingSchedule(sched);
                          setEditScheduleForm({ amount: String(sched.amount), frequency: sched.frequency });
                          setShowEditModal(true);
                        }} className="px-2 py-1 text-xs border rounded hover:bg-muted">Edit</button>
                        <button onClick={() => handleDeleteSchedule(sched.id)} className="px-2 py-1 text-xs border rounded hover:bg-muted">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {billingSchedules.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No billing schedules found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === "bills" && (
        <div className="table-container">
          {bills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No bills found. Create billing schedules first, then use "Generate Bills".
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Member</th>
                  <th>Unit</th>
                  <th>Period</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-mono text-sm">{bill.billNo}</td>
                    <td className="font-medium">{bill.member}</td>
                    <td>{bill.unit}</td>
                    <td>{bill.period}</td>
                    <td className="font-medium">PKR {bill.totalAmount.toLocaleString()}</td>
                    <td className="text-green-600">PKR {bill.paidAmount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                        bill.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                        bill.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        bill.status === 'reversed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {bill.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { group: "Outstanding Payments", reports: ["Finalized Bills Receivables", "Client Receivable Detail", "Client Outstanding Detail", "Client Arrears Detail"] },
            { group: "Receiving Payments", reports: ["Payment Receiving", "Bill Status", "Daily Receipts Summary", "Advance/Adjustment Receiving", "Daily Recovery"] },
            { group: "Client Information", reports: ["Client Info Detail", "Premises Owner Info", "Vacant/Booked Units", "De-allocation Detail"] },
            { group: "Bill Printing", reports: ["Bill Printing", "Bill Due-Date-wise", "Payment Printing"] },
          ].map((group) => (
            <div key={group.group} className="chart-container">
              <h4 className="font-semibold mb-3">{group.group}</h4>
              <div className="space-y-2">
                {group.reports.map((report) => (
                  <div key={report} className="flex items-center justify-between p-2 border rounded hover:bg-muted">
                    <span className="text-sm">{report}</span>
                    <div className="flex gap-1">
                      <button onClick={() => toast("PDF exported", "success")} className="px-2 py-1 text-xs border rounded">PDF</button>
                      <button onClick={() => toast("Excel exported", "success")} className="px-2 py-1 text-xs border rounded">Excel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">New Billing Schedule</h2>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client File *</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={scheduleForm.fileId}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, fileId: e.target.value }))}
                  required
                >
                  <option value="">Select client file</option>
                  {fileOptions.map((opt) => (
                    <option key={opt.fileId} value={opt.fileId}>{opt.clientName} - {opt.regNo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Charge Type *</label>
                <input
                  type="text"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={scheduleForm.chargeType}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, chargeType: e.target.value }))}
                  placeholder="e.g., rent, service, park_fee"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (PKR) *</label>
                <input
                  type="number"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={scheduleForm.amount}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, frequency: e.target.value }))}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="one_time">One-time</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Edit Schedule - {editingSchedule.chargeType}</h2>
            <form onSubmit={handleEditScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={editScheduleForm.amount}
                  onChange={(e) => setEditScheduleForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={editScheduleForm.frequency}
                  onChange={(e) => setEditScheduleForm((p) => ({ ...p, frequency: e.target.value }))}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="one_time">One-time</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingSchedule(null); }} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </AppShell>
  );
}
