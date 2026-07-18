"use client";

import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

const stats = [
  { label: "Total Clients", value: "1,247", change: "+12%", color: "text-blue-600" },
  { label: "Active Bookings", value: "389", change: "+8%", color: "text-green-600" },
  { label: "Total Revenue", value: "PKR 2.4B", change: "+15%", color: "text-emerald-600" },
  { label: "Outstanding", value: "PKR 890M", change: "-5%", color: "text-orange-600" },
  { label: "Available Plots", value: "1,847", change: "-3%", color: "text-purple-600" },
  { label: "Open Complaints", value: "23", change: "-18%", color: "text-red-600" },
  { label: "Active Leads", value: "456", change: "+22%", color: "text-cyan-600" },
  { label: "Monthly Collections", value: "PKR 185M", change: "+9%", color: "text-teal-600" },
];

const recentBookings = [
  { client: "Ahmed Khan", project: "Green Valley", plot: "Block A - 123", amount: "PKR 8.5M", date: "2026-07-15" },
  { client: "Sara Malik", project: "Blue Heights", plot: "Block B - 45", amount: "PKR 12.2M", date: "2026-07-14" },
  { client: "Ali Hassan", project: "Green Valley", plot: "Block C - 89", amount: "PKR 6.8M", date: "2026-07-14" },
  { client: "Fatima Raza", project: "Sunset Heights", plot: "Block A - 201", amount: "PKR 15.0M", date: "2026-07-13" },
  { client: "Usman Ali", project: "Blue Heights", plot: "Block D - 56", amount: "PKR 9.3M", date: "2026-07-13" },
];

const topProjects = [
  { name: "Green Valley", total: 500, booked: 312, available: 188 },
  { name: "Blue Heights", total: 300, booked: 198, available: 102 },
  { name: "Sunset Heights", total: 250, booked: 156, available: 94 },
  { name: "Lake View", total: 200, booked: 89, available: 111 },
];

const recentPayments = [
  { client: "Ahmed Khan", amount: "PKR 250,000", mode: "Online", date: "2026-07-15" },
  { client: "Sara Malik", amount: "PKR 500,000", mode: "Cheque", date: "2026-07-15" },
  { client: "Ali Hassan", amount: "PKR 150,000", mode: "Cash", date: "2026-07-14" },
  { client: "Fatima Raza", amount: "PKR 750,000", mode: "Bank", date: "2026-07-14" },
  { client: "Usman Ali", amount: "PKR 300,000", mode: "Online", date: "2026-07-13" },
];

export default function Dashboard() {
  const { toast, ToastContainer } = useToast();
  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => window.location.href = '/bookings'} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">+ New Booking</button>
          <button onClick={() => toast("Report exported successfully", "success")} className="px-4 py-2 border rounded-md text-sm font-medium">Export Report</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-card-value ${stat.color}`}>{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
            <div className={`text-xs mt-1 ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {stat.change} from last month
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="chart-container">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Bookings</h3>
              <a href="/bookings" className="text-sm text-primary hover:underline">View All</a>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Project</th>
                    <th>Plot</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b, i) => (
                    <tr key={i}>
                      <td className="font-medium">{b.client}</td>
                      <td>{b.project}</td>
                      <td>{b.plot}</td>
                      <td className="font-medium">{b.amount}</td>
                      <td className="text-muted-foreground">{b.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Projects */}
        <div>
          <div className="chart-container">
            <h3 className="font-semibold mb-4">Project Inventory</h3>
            <div className="space-y-4">
              {topProjects.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.booked}/{p.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(p.booked / p.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{p.booked} booked</span>
                    <span>{p.available} available</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Payments</h3>
            <a href="/receipts" className="text-sm text-primary hover:underline">View All</a>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p, i) => (
                  <tr key={i}>
                    <td className="font-medium">{p.client}</td>
                    <td className="font-medium text-green-600">{p.amount}</td>
                    <td>
                      <span className="status-badge bg-blue-100 text-blue-800">{p.mode}</span>
                    </td>
                    <td className="text-muted-foreground">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Compliance */}
        <div className="chart-container">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/clients" className="block p-4 border rounded-lg hover:bg-muted transition-colors text-center">
              <div className="text-2xl mb-1">👤</div>
              <div className="text-sm font-medium">New Client</div>
            </a>
            <a href="/bookings" className="block p-4 border rounded-lg hover:bg-muted transition-colors text-center">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-sm font-medium">New Booking</div>
            </a>
            <a href="/receipts" className="block p-4 border rounded-lg hover:bg-muted transition-colors text-center">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-sm font-medium">Record Payment</div>
            </a>
            <a href="/crm" className="block p-4 border rounded-lg hover:bg-muted transition-colors text-center">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-sm font-medium">Add Lead</div>
            </a>
            <a href="/complaints" className="block p-4 border rounded-lg hover:bg-muted transition-colors text-center">
              <div className="text-2xl mb-1">🎫</div>
              <div className="text-sm font-medium">Log Complaint</div>
            </a>
            <a href="/billing" className="block p-4 border rounded-lg hover:bg-muted transition-colors text-center">
              <div className="text-2xl mb-1">🧾</div>
              <div className="text-sm font-medium">Generate Bills</div>
            </a>
            <a href="/digital-map" className="block p-4 border rounded-lg hover:bg-muted transition-colors text-center">
              <div className="text-2xl mb-1">🗺️</div>
              <div className="text-sm font-medium">Digital Map</div>
            </a>
            <a href="/reports" className="block p-4 border rounded-lg hover:bg-muted transition-colors text-center">
              <div className="text-2xl mb-1">📈</div>
              <div className="text-sm font-medium">Reports</div>
            </a>
          </div>
        </div>
      </div>
      <ToastContainer />
    </AppShell>
  );
}
