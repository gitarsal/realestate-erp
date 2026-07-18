"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

interface Vendor {
  id: string;
  name: string;
}

interface StockItem {
  item: string;
  available: number;
  reserved: number;
  minLevel: number;
  unit: string;
}

interface PurchaseOrder {
  id: string;
  poNo: string;
  item: string;
  quantity: number | string;
  rate: number | string;
  totalAmount: number | string;
  status: string;
  deliveryDate: string | null;
  vendor?: { name: string } | null;
}

const initialStockItems: StockItem[] = [
  { item: "Cement (50kg bags)", available: 1200, reserved: 200, minLevel: 500, unit: "bags" },
  { item: "Steel Rods (10mm)", available: 850, reserved: 150, minLevel: 300, unit: "pcs" },
  { item: "Bricks", available: 45000, reserved: 5000, minLevel: 20000, unit: "pcs" },
  { item: "Sand (fine)", available: 25, reserved: 5, minLevel: 10, unit: "tons" },
  { item: "Gravel", available: 18, reserved: 3, minLevel: 8, unit: "tons" },
  { item: "PVC Pipes (4 inch)", available: 320, reserved: 50, minLevel: 100, unit: "pcs" },
];

export default function ConstructionPage() {
  const { toast, ToastContainer } = useToast();
  const [showModal, setShowModal] = useState<"po" | "requisition" | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stockItems] = useState(initialStockItems);

  const [poForm, setPoForm] = useState({
    vendorId: "",
    item: "",
    qty: "",
    rate: "",
    deliveryDate: "",
  });

  const [reqForm, setReqForm] = useState({
    item: "Cement (50kg bags)",
    qty: "",
    department: "Construction",
    notes: "",
  });

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      const data = await res.json();
      setPurchaseOrders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load purchase orders");
      toast("Failed to load purchase orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      const data = await res.json();
      setVendors(data);
    } catch {
      toast("Failed to load vendors", "error");
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchVendors();
  }, []);

  const handlePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.vendorId) { toast("Please select a vendor", "error"); return; }
    if (!poForm.item) { toast("Please enter an item name", "error"); return; }
    if (!poForm.qty || !poForm.rate) { toast("Please enter quantity and rate", "error"); return; }
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: poForm.vendorId,
          item: poForm.item,
          quantity: parseFloat(poForm.qty),
          rate: parseFloat(poForm.rate),
          deliveryDate: poForm.deliveryDate || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create purchase order");
      }
      toast("Purchase Order created", "success");
      setShowModal(null);
      setPoForm({ vendorId: "", item: "", qty: "", rate: "", deliveryDate: "" });
      fetchPurchaseOrders();
    } catch (err: any) {
      toast(err.message || "Failed to create purchase order", "error");
    }
  };

  const handleReqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Requisition submitted", "success");
    setShowModal(null);
    setReqForm({ item: "Cement (50kg bags)", qty: "", department: "Construction", notes: "" });
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Construction & Store Management (C&SMS)</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowModal("po")} className="px-4 py-2 border rounded-md text-sm font-medium">New PO</button>
          <button onClick={() => setShowModal("requisition")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Stock Requisition</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-card-value text-blue-600">{stockItems.length}</div>
          <div className="stat-card-label">Stock Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-orange-600">{purchaseOrders.length}</div>
          <div className="stat-card-label">Active POs</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-green-600">PKR 2.1M</div>
          <div className="stat-card-label">Monthly Procurement</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-red-600">{stockItems.filter(s => s.available < s.minLevel).length}</div>
          <div className="stat-card-label">Low Stock Alerts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="font-semibold mb-4">Store Stock Status</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Min Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stockItems.map((s) => (
                  <tr key={s.item}>
                    <td className="font-medium text-sm">{s.item}</td>
                    <td>{s.available.toLocaleString()} {s.unit}</td>
                    <td>{s.reserved.toLocaleString()} {s.unit}</td>
                    <td>{s.minLevel.toLocaleString()} {s.unit}</td>
                    <td>
                      <span className={`status-badge ${s.available < s.minLevel ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {s.available < s.minLevel ? 'Low Stock' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="chart-container">
          <h3 className="font-semibold mb-4">Recent Purchase Orders</h3>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading purchase orders...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>PO No</th>
                    <th>Vendor</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td className="font-mono text-sm">{po.poNo}</td>
                      <td className="font-medium">{po.vendor?.name || "-"}</td>
                      <td>{po.item}</td>
                      <td>{Number(po.quantity).toLocaleString()}</td>
                      <td className="font-medium">PKR {Number(po.totalAmount).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${
                          po.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          po.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{po.status.charAt(0).toUpperCase() + po.status.slice(1)}</span>
                      </td>
                    </tr>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No purchase orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal === "po" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Purchase Order</h2>
              <button onClick={() => setShowModal(null)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <form onSubmit={handlePoSubmit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Vendor *</label>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                    value={poForm.vendorId}
                    onChange={(e) => setPoForm((p) => ({ ...p, vendorId: e.target.value }))}
                    required
                  >
                    <option value="">Select vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Item *</label>
                  <input
                    type="text"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="Material name"
                    value={poForm.item}
                    onChange={(e) => setPoForm((p) => ({ ...p, item: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Quantity *</label>
                  <input
                    type="number"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="500"
                    value={poForm.qty}
                    onChange={(e) => setPoForm((p) => ({ ...p, qty: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Rate (PKR) *</label>
                  <input
                    type="number"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="1250"
                    value={poForm.rate}
                    onChange={(e) => setPoForm((p) => ({ ...p, rate: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Delivery Date</label>
                  <input
                    type="date"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                    value={poForm.deliveryDate}
                    onChange={(e) => setPoForm((p) => ({ ...p, deliveryDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Submit PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === "requisition" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Stock Requisition</h2>
              <button onClick={() => setShowModal(null)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <form onSubmit={handleReqSubmit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Item *</label>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                    value={reqForm.item}
                    onChange={(e) => setReqForm((p) => ({ ...p, item: e.target.value }))}
                    required
                  >
                    <option>Cement (50kg bags)</option>
                    <option>Steel Rods</option>
                    <option>Bricks</option>
                    <option>Sand (fine)</option>
                    <option>Gravel</option>
                    <option>PVC Pipes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Quantity *</label>
                  <input
                    type="number"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="100"
                    value={reqForm.qty}
                    onChange={(e) => setReqForm((p) => ({ ...p, qty: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">Department *</label>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                    value={reqForm.department}
                    onChange={(e) => setReqForm((p) => ({ ...p, department: e.target.value }))}
                    required
                  >
                    <option>Construction</option>
                    <option>Maintenance</option>
                    <option>Landscaping</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  className="min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="Requisition reason"
                  value={reqForm.notes}
                  onChange={(e) => setReqForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Submit Requisition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </AppShell>
  );
}
