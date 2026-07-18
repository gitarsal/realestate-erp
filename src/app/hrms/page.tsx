"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

const hrStats = [
  { label: "Total Employees", value: 156, color: "text-blue-600" },
  { label: "Active", value: 148, color: "text-green-600" },
  { label: "On Leave Today", value: 12, color: "text-orange-600" },
  { label: "Pending Loans", value: 8, color: "text-purple-600" },
  { label: "Departments", value: 8, color: "text-cyan-600" },
  { label: "Monthly Payroll", value: "PKR 18.5M", color: "text-emerald-600" },
];

const LEAVE_TYPE_MAP: Record<string, string> = {
  "annual": "Annual",
  "casual": "Casual",
  "sick": "Sick",
  "exceptional": "Exceptional",
};

export default function HRMSPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "employees" | "attendance" | "leaves" | "payroll">("employees");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showLeaveViewModal, setShowLeaveViewModal] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [viewingLeave, setViewingLeave] = useState<any>(null);
  const { toast, ToastContainer } = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [empFilterDept, setEmpFilterDept] = useState("All Departments");

  const [empForm, setEmpForm] = useState({ firstName: "", lastName: "", cnic: "", phone: "", email: "", departmentId: "", designationId: "", joinDate: "", salary: "", gender: "" });
  const [editEmpForm, setEditEmpForm] = useState({ firstName: "", lastName: "", cnic: "", phone: "", email: "", departmentId: "", designationId: "", joinDate: "", salary: "", gender: "" });
  const [leaveForm, setLeaveForm] = useState({ empId: "", typeId: "", from: "", to: "", reason: "" });

  const fetchEmployees = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (empSearchQuery) params.set("search", empSearchQuery);
      const res = await fetch(`/api/employees?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(data);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load employees");
    }
  }, [empSearchQuery]);

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await fetch("/api/leaves");
      if (!res.ok) throw new Error("Failed to fetch leaves");
      const data = await res.json();
      setLeaves(data);
    } catch (e: any) {
      toast(e.message || "Failed to load leaves", "error");
    }
  }, [toast]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();
      setDepartments(data);
    } catch (e: any) {
      toast(e.message || "Failed to load departments", "error");
    }
  }, [toast]);

  const fetchDesignations = useCallback(async () => {
    try {
      const res = await fetch("/api/designations");
      if (!res.ok) throw new Error("Failed to fetch designations");
      const data = await res.json();
      setDesignations(data);
    } catch (e: any) {
      toast(e.message || "Failed to load designations", "error");
    }
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchEmployees(), fetchLeaves(), fetchDepartments(), fetchDesignations()]);
    setLoading(false);
  }, [fetchEmployees, fetchLeaves, fetchDepartments, fetchDesignations]);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`;
    const matchesSearch =
      fullName.toLowerCase().includes(empSearchQuery.toLowerCase()) ||
      (emp.empCode || "").toLowerCase().includes(empSearchQuery.toLowerCase());
    const matchesDept = empFilterDept === "All Departments" || emp.department?.name === empFilterDept;
    return matchesSearch && matchesDept;
  });

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: empForm.firstName,
          lastName: empForm.lastName,
          cnic: empForm.cnic,
          phone: empForm.phone,
          email: empForm.email || undefined,
          departmentId: empForm.departmentId,
          designationId: empForm.designationId,
          joinDate: empForm.joinDate,
          salary: parseFloat(empForm.salary) || 0,
          gender: empForm.gender || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add employee");
      }
      toast("Employee added successfully", "success");
      setShowModal(false);
      setEmpForm({ firstName: "", lastName: "", cnic: "", phone: "", email: "", departmentId: "", designationId: "", joinDate: "", salary: "", gender: "" });
      fetchEmployees();
    } catch (e: any) {
      toast(e.message || "Failed to add employee", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    try {
      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editEmpForm.firstName,
          lastName: editEmpForm.lastName,
          cnic: editEmpForm.cnic || undefined,
          phone: editEmpForm.phone || undefined,
          email: editEmpForm.email || undefined,
          departmentId: editEmpForm.departmentId,
          designationId: editEmpForm.designationId,
          joinDate: editEmpForm.joinDate,
          salary: parseFloat(editEmpForm.salary) || undefined,
          gender: editEmpForm.gender || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update employee");
      }
      toast("Employee updated successfully", "success");
      setShowEditModal(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (e: any) {
      toast(e.message || "Failed to update employee", "error");
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empId: leaveForm.empId,
          typeId: leaveForm.typeId,
          fromDate: leaveForm.from,
          toDate: leaveForm.to,
          reason: leaveForm.reason || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to apply leave");
      }
      toast("Leave application submitted", "success");
      setShowLeaveModal(false);
      setLeaveForm({ empId: "", typeId: "", from: "", to: "", reason: "" });
      fetchLeaves();
    } catch (e: any) {
      toast(e.message || "Failed to apply leave", "error");
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      if (!res.ok) throw new Error("Failed to approve leave");
      toast("Leave approved", "success");
      fetchLeaves();
    } catch (e: any) {
      toast(e.message || "Failed to approve leave", "error");
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (!res.ok) throw new Error("Failed to reject leave");
      toast("Leave rejected", "error");
      fetchLeaves();
    } catch (e: any) {
      toast(e.message || "Failed to reject leave", "error");
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">HRMS & Payroll</h1>
        <div className="flex gap-2">
          <button onClick={() => toast("Payroll generated for July 2026", "success")} className="px-4 py-2 border rounded-md text-sm font-medium">Run Payroll</button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ Add Employee</button>
        </div>
      </div>

      <div className="flex gap-1 border-b mb-6">
        {(["overview", "employees", "attendance", "leaves", "payroll"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{error}</div>
      )}

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {hrStats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className={`stat-card-value ${stat.color}`}>{stat.value}</div>
                <div className="stat-card-label">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="chart-container">
              <h3 className="font-semibold mb-4">Department Overview</h3>
              <div className="space-y-3">
                {departments.map((dept: any) => (
                  <div key={dept.id} className="flex items-center gap-3">
                    <span className="text-sm w-24">{dept.name}</span>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "50%" }}></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{dept.code}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container">
              <h3 className="font-semibold mb-4">Today&apos;s Attendance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg text-center"><div className="text-3xl font-bold text-green-600">132</div><div className="text-sm text-muted-foreground">Present</div></div>
                <div className="p-4 border rounded-lg text-center"><div className="text-3xl font-bold text-red-600">16</div><div className="text-sm text-muted-foreground">Absent</div></div>
                <div className="p-4 border rounded-lg text-center"><div className="text-3xl font-bold text-orange-600">8</div><div className="text-sm text-muted-foreground">Late</div></div>
                <div className="p-4 border rounded-lg text-center"><div className="text-3xl font-bold text-blue-600">12</div><div className="text-sm text-muted-foreground">On Leave</div></div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "employees" && (
        <>
          <div className="flex gap-3 mb-6">
            <input type="text" placeholder="Search employees..." className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96" value={empSearchQuery} onChange={(e) => setEmpSearchQuery(e.target.value)} />
            <select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={empFilterDept} onChange={(e) => setEmpFilterDept(e.target.value)}>
              <option>All Departments</option>
              {departments.map((d: any) => (<option key={d.id}>{d.name}</option>))}
            </select>
          </div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading employees...</div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Department</th><th>Designation</th><th>Join Date</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td className="font-mono text-sm">{emp.empCode}</td>
                      <td className="font-medium">{emp.firstName} {emp.lastName}</td>
                      <td>{emp.department?.name || "N/A"}</td>
                      <td>{emp.designation?.name || "N/A"}</td>
                      <td className="text-muted-foreground">{emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : "-"}</td>
                      <td className="font-medium">PKR {Number(emp.salary).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {emp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => { setViewingEmployee(emp); setShowViewModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                          <button onClick={() => { setEditingEmployee(emp); setEditEmpForm({ firstName: emp.firstName, lastName: emp.lastName, cnic: emp.cnic || "", phone: emp.phone || "", email: emp.email || "", departmentId: emp.departmentId, designationId: emp.designationId, joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : "", salary: String(emp.salary), gender: emp.gender || "" }); setShowEditModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No employees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "attendance" && (
        <div className="chart-container">
          <h3 className="font-semibold mb-4">Attendance Monitor</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Overtime</th></tr></thead>
              <tbody>
                {employees.slice(0, 5).map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-medium">{emp.firstName} {emp.lastName}</td>
                    <td>{emp.department?.name || "N/A"}</td>
                    <td>2026-07-16</td>
                    <td>09:0{Math.floor(Math.random() * 9)} AM</td>
                    <td>{emp.isActive ? `0${5 + Math.floor(Math.random() * 2)}:0${Math.floor(Math.random() * 9)} PM` : '-'}</td>
                    <td><span className={`status-badge ${emp.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{emp.isActive ? "Present" : "Absent"}</span></td>
                    <td>{emp.isActive ? `${Math.floor(Math.random() * 3)}h ${Math.floor(Math.random() * 60)}m` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "leaves" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            {[{ type: "Annual", total: 20, remaining: 8 }, { type: "Casual", total: 10, remaining: 4 }, { type: "Sick", total: 8, remaining: 5 }, { type: "Exceptional", total: 5, remaining: 4 }].map((leave) => (
              <div key={leave.type} className="stat-card">
                <div className="text-sm text-muted-foreground mb-1">{leave.type} Leave</div>
                <div className="text-lg font-bold">{leave.remaining} / {leave.total}</div>
                <div className="text-xs text-muted-foreground">Remaining / Total days</div>
              </div>
            ))}
          </div>
          <div className="chart-container">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Leave Applications</h3>
              <button onClick={() => setShowLeaveModal(true)} className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium">Apply Leave</button>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {leaves.map((leave: any) => (
                    <tr key={leave.id}>
                      <td className="font-medium">{leave.employee?.firstName} {leave.employee?.lastName}</td>
                      <td><span className="status-badge bg-gray-100 text-gray-800">{LEAVE_TYPE_MAP[leave.leaveType?.name] || leave.leaveType?.name}</span></td>
                      <td>{leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : "-"}</td>
                      <td>{leave.toDate ? new Date(leave.toDate).toLocaleDateString() : "-"}</td>
                      <td>{leave.days}</td>
                      <td><span className={`status-badge ${leave.status === 'approved' ? 'bg-green-100 text-green-800' : leave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}</span></td>
                      <td>
                        {leave.status === 'pending' ? (
                          <div className="flex gap-1">
                            <button onClick={() => handleApproveLeave(leave.id)} className="px-2 py-1 text-xs bg-green-600 text-white rounded">Approve</button>
                            <button onClick={() => handleRejectLeave(leave.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Reject</button>
                          </div>
                        ) : (
                          <button onClick={() => { setViewingLeave(leave); setShowLeaveViewModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No leave applications found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "payroll" && (
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Payroll - July 2026</h3>
            <div className="flex gap-2">
              <button onClick={() => toast("Previewing payroll run", "info")} className="px-3 py-1 border rounded-md text-xs font-medium">Preview</button>
              <button onClick={() => toast("Payroll generated successfully", "success")} className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs font-medium">Generate Payroll</button>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>ID</th><th>Employee</th><th>Department</th><th>Basic Salary</th><th>Allowances</th><th>Deductions</th><th>Loan</th><th>Net Salary</th><th>Status</th></tr></thead>
              <tbody>
                {employees.map((emp) => {
                  const base = Number(emp.salary) || 0;
                  return (
                    <tr key={emp.id}>
                      <td className="font-mono text-sm">{emp.empCode}</td>
                      <td className="font-medium">{emp.firstName} {emp.lastName}</td>
                      <td>{emp.department?.name || "N/A"}</td>
                      <td>PKR {base.toLocaleString()}</td>
                      <td>PKR {Math.round(base * 0.3).toLocaleString()}</td>
                      <td className="text-red-600">PKR {Math.round(base * 0.15).toLocaleString()}</td>
                      <td>PKR 0</td>
                      <td className="font-medium text-green-600">PKR {Math.round(base * 1.15).toLocaleString()}</td>
                      <td><span className="status-badge bg-yellow-100 text-yellow-800">Draft</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Employee</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleEmpSubmit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group"><label className="text-sm font-medium">First Name *</label><input type="text" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="Enter first name" value={empForm.firstName} onChange={(e) => setEmpForm((p) => ({ ...p, firstName: e.target.value }))} required /></div>
                <div className="form-group"><label className="text-sm font-medium">Last Name *</label><input type="text" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="Enter last name" value={empForm.lastName} onChange={(e) => setEmpForm((p) => ({ ...p, lastName: e.target.value }))} required /></div>
                <div className="form-group"><label className="text-sm font-medium">CNIC *</label><input type="text" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g., 35202-1234567-1" value={empForm.cnic} onChange={(e) => setEmpForm((p) => ({ ...p, cnic: e.target.value }))} required /></div>
                <div className="form-group"><label className="text-sm font-medium">Phone *</label><input type="text" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g., 0300-1234567" value={empForm.phone} onChange={(e) => setEmpForm((p) => ({ ...p, phone: e.target.value }))} required /></div>
                <div className="form-group"><label className="text-sm font-medium">Email</label><input type="email" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" placeholder="e.g., name@example.com" value={empForm.email} onChange={(e) => setEmpForm((p) => ({ ...p, email: e.target.value }))} /></div>
                <div className="form-group"><label className="text-sm font-medium">Gender</label><select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={empForm.gender} onChange={(e) => setEmpForm((p) => ({ ...p, gender: e.target.value }))}><option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option></select></div>
                <div className="form-group"><label className="text-sm font-medium">Department *</label><select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={empForm.departmentId} onChange={(e) => setEmpForm((p) => ({ ...p, departmentId: e.target.value }))} required><option value="">Select Department</option>{departments.map((d: any) => (<option key={d.id} value={d.id}>{d.name}</option>))}</select></div>
                <div className="form-group"><label className="text-sm font-medium">Designation *</label><select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={empForm.designationId} onChange={(e) => setEmpForm((p) => ({ ...p, designationId: e.target.value }))} required><option value="">Select Designation</option>{designations.map((d: any) => (<option key={d.id} value={d.id}>{d.name}</option>))}</select></div>
                <div className="form-group"><label className="text-sm font-medium">Join Date *</label><input type="date" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={empForm.joinDate} onChange={(e) => setEmpForm((p) => ({ ...p, joinDate: e.target.value }))} required /></div>
              </div>
              <div className="form-group"><label className="text-sm font-medium">Salary *</label><input type="number" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" placeholder="e.g., 80000" value={empForm.salary} onChange={(e) => setEmpForm((p) => ({ ...p, salary: e.target.value }))} required /></div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingEmployee && (
        <div className="modal-overlay" onClick={() => { setShowViewModal(false); setViewingEmployee(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Employee Details</h2>
              <button onClick={() => { setShowViewModal(false); setViewingEmployee(null); }} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-3">
              {[["Employee Code", viewingEmployee.empCode], ["Name", `${viewingEmployee.firstName} ${viewingEmployee.lastName}`], ["CNIC", viewingEmployee.cnic || "N/A"], ["Phone", viewingEmployee.phone || "N/A"], ["Email", viewingEmployee.email || "N/A"], ["Department", viewingEmployee.department?.name || "N/A"], ["Designation", viewingEmployee.designation?.name || "N/A"], ["Join Date", viewingEmployee.joinDate ? new Date(viewingEmployee.joinDate).toLocaleDateString() : "N/A"], ["Salary", `PKR ${Number(viewingEmployee.salary).toLocaleString()}`]].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`status-badge ${viewingEmployee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {viewingEmployee.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => { setShowViewModal(false); setViewingEmployee(null); }} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingEmployee && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingEmployee(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Employee - {editingEmployee.empCode}</h2>
              <button onClick={() => { setShowEditModal(false); setEditingEmployee(null); }} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="form-grid">
                <div className="form-group"><label className="text-sm font-medium">First Name *</label><input type="text" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editEmpForm.firstName} onChange={(e) => setEditEmpForm((p) => ({ ...p, firstName: e.target.value }))} required /></div>
                <div className="form-group"><label className="text-sm font-medium">Last Name *</label><input type="text" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editEmpForm.lastName} onChange={(e) => setEditEmpForm((p) => ({ ...p, lastName: e.target.value }))} required /></div>
                <div className="form-group"><label className="text-sm font-medium">Department *</label><select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editEmpForm.departmentId} onChange={(e) => setEditEmpForm((p) => ({ ...p, departmentId: e.target.value }))} required><option value="">Select Department</option>{departments.map((d: any) => (<option key={d.id} value={d.id}>{d.name}</option>))}</select></div>
                <div className="form-group"><label className="text-sm font-medium">Designation *</label><select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editEmpForm.designationId} onChange={(e) => setEditEmpForm((p) => ({ ...p, designationId: e.target.value }))} required><option value="">Select Designation</option>{designations.map((d: any) => (<option key={d.id} value={d.id}>{d.name}</option>))}</select></div>
                <div className="form-group"><label className="text-sm font-medium">Join Date *</label><input type="date" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editEmpForm.joinDate} onChange={(e) => setEditEmpForm((p) => ({ ...p, joinDate: e.target.value }))} required /></div>
                <div className="form-group"><label className="text-sm font-medium">Salary *</label><input type="number" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={editEmpForm.salary} onChange={(e) => setEditEmpForm((p) => ({ ...p, salary: e.target.value }))} required /></div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingEmployee(null); }} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Apply for Leave</h2>
              <button onClick={() => setShowLeaveModal(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div className="form-group">
                <label className="text-sm font-medium">Employee *</label>
                <select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" value={leaveForm.empId} onChange={(e) => setLeaveForm((p) => ({ ...p, empId: e.target.value }))} required>
                  <option value="">Select Employee</option>
                  {employees.map((emp: any) => (<option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Leave Type *</label>
                <select className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" value={leaveForm.typeId} onChange={(e) => setLeaveForm((p) => ({ ...p, typeId: e.target.value }))} required>
                  <option value="">Select Leave Type</option>
                  <option value="annual">Annual</option>
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="exceptional">Exceptional</option>
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group"><label className="text-sm font-medium">From *</label><input type="date" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" value={leaveForm.from} onChange={(e) => setLeaveForm((p) => ({ ...p, from: e.target.value }))} required /></div>
                <div className="form-group"><label className="text-sm font-medium">To *</label><input type="date" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full" value={leaveForm.to} onChange={(e) => setLeaveForm((p) => ({ ...p, to: e.target.value }))} required /></div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Reason</label>
                <textarea className="min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm w-full" placeholder="Reason for leave" value={leaveForm.reason} onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowLeaveModal(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLeaveViewModal && viewingLeave && (
        <div className="modal-overlay" onClick={() => { setShowLeaveViewModal(false); setViewingLeave(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Leave Details</h2>
              <button onClick={() => { setShowLeaveViewModal(false); setViewingLeave(null); }} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="space-y-3">
              {[["Employee", `${viewingLeave.employee?.firstName} ${viewingLeave.employee?.lastName}`], ["Type", LEAVE_TYPE_MAP[viewingLeave.leaveType?.name] || viewingLeave.leaveType?.name], ["From", viewingLeave.fromDate ? new Date(viewingLeave.fromDate).toLocaleDateString() : "-"], ["To", viewingLeave.toDate ? new Date(viewingLeave.toDate).toLocaleDateString() : "-"], ["Days", String(viewingLeave.days)], ["Reason", viewingLeave.reason || "N/A"]].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`status-badge ${viewingLeave.status === 'approved' ? 'bg-green-100 text-green-800' : viewingLeave.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{viewingLeave.status.charAt(0).toUpperCase() + viewingLeave.status.slice(1)}</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => { setShowLeaveViewModal(false); setViewingLeave(null); }} className="px-4 py-2 border rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </AppShell>
  );
}
