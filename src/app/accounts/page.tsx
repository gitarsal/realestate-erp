"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Voucher {
  id: string;
  voucherNo: string;
  type: string;
  date: string;
  narration: string | null;
  status: string;
  entries: { debit: number; credit: number; account: { name: string; code: string } }[];
}

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "chart" | "statements">("overview");
  const [showModal, setShowModal] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { toast, ToastContainer } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All Types");

  const [voucherForm, setVoucherForm] = useState({
    type: "Payment",
    date: "",
    narration: "",
    debitAccount: "",
    creditAccount: "",
    amount: "",
  });

  const [addAccountForm, setAddAccountForm] = useState({
    code: "",
    name: "",
    type: "asset",
  });

  const [editAccountForm, setEditAccountForm] = useState({
    code: "",
    name: "",
    type: "asset",
  });

  const accountTypes = [
    { type: "Assets", count: accounts.filter(a => a.type === "asset").length },
    { type: "Liabilities", count: accounts.filter(a => a.type === "liability").length },
    { type: "Equity", count: accounts.filter(a => a.type === "equity").length },
    { type: "Revenue", count: accounts.filter(a => a.type === "revenue").length },
    { type: "Expenses", count: accounts.filter(a => a.type === "expense").length },
  ];

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const [accRes, vchRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/vouchers"),
      ]);
      if (!accRes.ok) throw new Error("Failed to fetch accounts");
      setAccounts(await accRes.json());
      if (vchRes.ok) setVouchers(await vchRes.json());
    } catch (err: any) {
      setError(err.message || "Failed to load accounts");
      toast("Failed to load accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || acc.code.includes(searchQuery);
    const matchesType = filterType === "All Types" || acc.type === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherForm.debitAccount || !voucherForm.creditAccount) {
      toast("Please select both debit and credit accounts", "error");
      return;
    }
    if (!voucherForm.amount || parseFloat(voucherForm.amount) <= 0) {
      toast("Please enter a valid amount", "error");
      return;
    }
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: voucherForm.type.toLowerCase(),
          date: voucherForm.date || new Date().toISOString().split("T")[0],
          narration: voucherForm.narration || null,
          entries: [
            { accountId: voucherForm.debitAccount, debit: parseFloat(voucherForm.amount), credit: 0 },
            { accountId: voucherForm.creditAccount, debit: 0, credit: parseFloat(voucherForm.amount) },
          ],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create voucher");
      }
      toast("Voucher saved as draft", "success");
      setShowModal(false);
      setVoucherForm({ type: "Payment", date: "", narration: "", debitAccount: "", creditAccount: "", amount: "" });
      fetchAccounts();
    } catch (err: any) {
      toast(err.message || "Failed to create voucher", "error");
    }
  };

  const handleAddAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addAccountForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create account");
      }
      toast("Account created", "success");
      setShowAddAccountModal(false);
      setAddAccountForm({ code: "", name: "", type: "asset" });
      fetchAccounts();
    } catch (err: any) {
      toast(err.message || "Failed to create account", "error");
    }
  };

  const handleEditAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    try {
      const res = await fetch(`/api/accounts/${editingAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editAccountForm.name, type: editAccountForm.type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update account");
      }
      toast("Account updated", "success");
      setShowEditAccountModal(false);
      setEditingAccount(null);
      fetchAccounts();
    } catch (err: any) {
      toast(err.message || "Failed to update account", "error");
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "asset": return "bg-blue-100 text-blue-800";
      case "liability": return "bg-red-100 text-red-800";
      case "equity": return "bg-green-100 text-green-800";
      case "revenue": return "bg-emerald-100 text-emerald-800";
      default: return "bg-orange-100 text-orange-800";
    }
  };

  const totalVoucherAmount = vouchers.reduce((s, v) => s + v.entries.reduce((es, e) => es + Number(e.debit), 0), 0);
  const postedVouchers = vouchers.filter(v => v.status === 'posted').length;
  const draftVouchers = vouchers.filter(v => v.status === 'draft').length;

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Accounts Management (ACMS)</h1>
        <div className="flex gap-2">
          <button onClick={() => toast("Financial period locked", "success")} className="px-4 py-2 border rounded-md text-sm font-medium">Period Lock</button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ New Voucher</button>
        </div>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {(["overview", "chart", "statements"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "chart" ? "Chart of Accounts" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
            {accountTypes.map((a) => (
              <div key={a.type} className="stat-card">
                <div className="text-xs text-muted-foreground mb-1">{a.type}</div>
                <div className="text-lg font-bold">{a.count}</div>
                <div className="text-xs text-muted-foreground">accounts</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="stat-card">
              <div className="stat-card-value text-purple-600">{vouchers.length}</div>
              <div className="stat-card-label">Total Vouchers</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-green-600">PKR {totalVoucherAmount.toLocaleString()}</div>
              <div className="stat-card-label">Total Voucher Value</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value text-orange-600">{draftVouchers}</div>
              <div className="stat-card-label">Draft Vouchers</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="chart-container">
              <h3 className="font-semibold mb-4">Balance Sheet Summary</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Total Assets</span>
                    <span className="font-bold text-blue-600">{accountTypes.find(a => a.type === "Assets")?.count || 0} accounts</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Total Liabilities</span>
                    <span className="font-bold text-red-600">{accountTypes.find(a => a.type === "Liabilities")?.count || 0} accounts</span>
                  </div>
                  <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((accountTypes.find(a => a.type === "Liabilities")?.count || 0) / Math.max(accountTypes.find(a => a.type === "Assets")?.count || 1, 1) * 100, 100)}%` }}></div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Total Equity</span>
                    <span className="font-bold text-green-600">{accountTypes.find(a => a.type === "Equity")?.count || 0} accounts</span>
                  </div>
                  <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((accountTypes.find(a => a.type === "Equity")?.count || 0) / Math.max(accountTypes.find(a => a.type === "Assets")?.count || 1, 1) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <h3 className="font-semibold mb-4">Recent Vouchers</h3>
              {vouchers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No vouchers yet. Create one with the "+ New Voucher" button.</p>
              ) : (
                <div className="space-y-2">
                  {vouchers.slice(0, 5).map((v) => {
                    const totalDebit = v.entries.reduce((s, e) => s + Number(e.debit), 0);
                    return (
                      <div key={v.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="text-sm font-medium font-mono">{v.voucherNo}</div>
                          <div className="text-xs text-muted-foreground">{v.type.charAt(0).toUpperCase() + v.type.slice(1)} &middot; {new Date(v.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">PKR {totalDebit.toLocaleString()}</div>
                          <span className={`text-xs status-badge ${v.status === 'posted' ? 'bg-green-100 text-green-800' : v.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{v.status.charAt(0).toUpperCase() + v.status.slice(1)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "chart" && (
        <>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading accounts...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : (
            <>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option>All Types</option>
                  <option>Asset</option>
                  <option>Liability</option>
                  <option>Equity</option>
                  <option>Revenue</option>
                  <option>Expense</option>
                </select>
                <button onClick={() => setShowAddAccountModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ Add Account</button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Account Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id}>
                        <td className="font-mono">{acc.code}</td>
                        <td className="font-medium">{acc.name}</td>
                        <td>
                          <span className={`status-badge ${getTypeBadgeClass(acc.type)}`}>
                            {acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge bg-green-100 text-green-800">Active</span>
                        </td>
                        <td>
                          <button onClick={() => {
                            setEditingAccount(acc);
                            setEditAccountForm({ code: acc.code, name: acc.name, type: acc.type });
                            setShowEditAccountModal(true);
                          }} className="px-2 py-1 text-xs border rounded hover:bg-muted">Edit</button>
                        </td>
                      </tr>
                    ))}
                    {filteredAccounts.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No accounts found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "statements" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "Balance Sheet", icon: "📊", desc: "Assets, Liabilities & Equity position" },
            { name: "Profit & Loss", icon: "📈", desc: "Revenue & Expenses for the period" },
            { name: "Trial Balance", icon: "⚖️", desc: "All account balances summary" },
            { name: "General Ledger", icon: "📒", desc: "Transaction-wise account history" },
            { name: "Cash Book", icon: "💵", desc: "Cash receipts and payments" },
            { name: "Day Book", icon: "📅", desc: "All transactions for a specific date" },
            { name: "Cash Flow", icon: "🌊", desc: "Operating, Investing & Financing activities" },
            { name: "P&L Analysis", icon: "🔍", desc: "Period-over-period P&L comparison" },
            { name: "Expense Report", icon: "💸", desc: "Category-wise expense breakdown" },
            { name: "Voucher Report", icon: "📝", desc: "All vouchers by type and date" },
            { name: "Account Ledger", icon: "📋", desc: "Individual account transaction history" },
            { name: "Chart of Accounts", icon: "🗂️", desc: "Account structure with balances" },
          ].map((report) => (
            <div key={report.name} className="chart-container cursor-pointer hover:border-primary transition-colors">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{report.icon}</span>
                <div>
                  <h4 className="font-medium">{report.name}</h4>
                  <p className="text-sm text-muted-foreground">{report.desc}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => toast("Generating report...", "info")} className="px-3 py-1 text-xs border rounded-md">Generate</button>
                <button onClick={() => toast("PDF exported", "success")} className="px-3 py-1 text-xs border rounded-md">Export PDF</button>
                <button onClick={() => toast("Excel exported", "success")} className="px-3 py-1 text-xs border rounded-md">Export Excel</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">New Voucher</h2>
            <form onSubmit={handleVoucherSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Voucher Type</label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={voucherForm.type}
                  onChange={(e) => setVoucherForm((p) => ({ ...p, type: e.target.value }))}
                >
                  <option>Payment</option>
                  <option>Receipt</option>
                  <option>Journal</option>
                  <option>Sales</option>
                  <option>Refund</option>
                  <option>Adjustment</option>
                  <option>Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={voucherForm.date}
                  onChange={(e) => setVoucherForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Narration</label>
                <textarea
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  rows={3}
                  value={voucherForm.narration}
                  onChange={(e) => setVoucherForm((p) => ({ ...p, narration: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Debit Account</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={voucherForm.debitAccount}
                    onChange={(e) => setVoucherForm((p) => ({ ...p, debitAccount: e.target.value }))}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Credit Account</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={voucherForm.creditAccount}
                    onChange={(e) => setVoucherForm((p) => ({ ...p, creditAccount: e.target.value }))}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={voucherForm.amount}
                  onChange={(e) => setVoucherForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-muted-foreground">Add at least 2 account entries (Debit/Credit)</p>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Save Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add New Account</h2>
            <form onSubmit={handleAddAccountSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Account Code *</label>
                  <input
                    type="text"
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={addAccountForm.code}
                    onChange={(e) => setAddAccountForm((p) => ({ ...p, code: e.target.value }))}
                    placeholder="e.g., 7000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Name *</label>
                  <input
                    type="text"
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={addAccountForm.name}
                    onChange={(e) => setAddAccountForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Rent Expense"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={addAccountForm.type}
                    onChange={(e) => setAddAccountForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowAddAccountModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Add Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditAccountModal && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Edit Account - {editingAccount.code}</h2>
            <form onSubmit={handleEditAccountSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Account Name *</label>
                  <input
                    type="text"
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={editAccountForm.name}
                    onChange={(e) => setEditAccountForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={editAccountForm.type}
                    onChange={(e) => setEditAccountForm((p) => ({ ...p, type: e.target.value }))}
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowEditAccountModal(false); setEditingAccount(null); }} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
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
