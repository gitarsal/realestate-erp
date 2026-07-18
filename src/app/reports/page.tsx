"use client";

import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

const reportGroups = [
  {
    module: "Sales (SAMS)",
    reports: [
      "Sales Register", "Booking Report", "Allocation Report", "Transfer Report",
      "Cancellation Report", "Refund Report", "Merge Report", "Ageing/Outstanding Report",
      "Commission Payable Report", "Inventory Report"
    ]
  },
  {
    module: "CRM",
    reports: [
      "Staff Productivity", "Mature Leads", "Duplicate Leads", "Overall Lead Report",
      "Close Leads", "Close Lead Requests", "Date-Wise Source Leads",
      "Reference-Wise Lead", "Staff Calls Report"
    ]
  },
  {
    module: "Accounts (ACMS)",
    reports: [
      "Balance Sheet", "Profit & Loss", "Trial Balance", "General Ledger",
      "Cash Book", "Day Book", "Cash Flow", "Voucher Report",
      "Expense Report", "Account Ledger", "Chart of Accounts", "P&L Analysis"
    ]
  },
  {
    module: "Billing (BMMS)",
    reports: [
      "Outstanding Payments", "Client Receivable Detail", "Client Arrears",
      "Payment Receiving", "Daily Receipts", "Advance/Adjustment",
      "Bill Printing", "Client Info Detail"
    ]
  },
  {
    module: "Complaints (COMS)",
    reports: [
      "Complaints Dashboard", "Total Complaints Status",
      "Complaints-by-Staff", "Monthly Summary"
    ]
  },
  {
    module: "HRMS & Payroll",
    reports: [
      "HR Summary", "Payroll Summary", "Salary Slips", "Salary Sheet",
      "Attendance Report", "Leave Report", "Loan Report"
    ]
  },
  {
    module: "Construction & Store",
    reports: [
      "Stock Issuance", "Purchase Orders", "Daily Stock Requisitions", "Store Stock"
    ]
  },
  {
    module: "Land Management",
    reports: [
      "Land Records Summary", "Moza-wise Report", "Case Type Report"
    ]
  },
  {
    module: "Balloting",
    reports: [
      "Balloting Results", "Allocation Report", "Summary Sheet"
    ]
  },
];

export default function ReportsPage() {
  const { toast, ToastContainer } = useToast();

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <button onClick={() => toast("Opening custom report builder...", "info")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Custom Report</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-card-value text-blue-600">73</div>
          <div className="stat-card-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-green-600">9</div>
          <div className="stat-card-label">Module Categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-purple-600">12</div>
          <div className="stat-card-label">Saved Favorites</div>
        </div>
      </div>

      <div className="space-y-6">
        {reportGroups.map((group) => (
          <div key={group.module} className="chart-container">
            <h3 className="font-semibold mb-3">{group.module}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {group.reports.map((report) => (
                <div key={report} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <span className="text-sm font-medium">{report}</span>
                  <div className="flex gap-1">
                    <button onClick={() => toast(`Generating PDF: ${report}...`, "success")} className="px-2 py-1 text-xs border rounded">PDF</button>
                    <button onClick={() => toast(`Exporting Excel: ${report}...`, "success")} className="px-2 py-1 text-xs border rounded">Excel</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ToastContainer />
    </AppShell>
  );
}
