"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  { section: "Overview", items: [
    { label: "Dashboard", href: "/", icon: "📊" },
  ]},
  { section: "Sales & CRM", items: [
    { label: "Digital Map", href: "/digital-map", icon: "🗺️" },
    { label: "Clients & Files", href: "/clients", icon: "👤" },
    { label: "Bookings", href: "/bookings", icon: "📋" },
    { label: "Receipts", href: "/receipts", icon: "💰" },
    { label: "Transfers", href: "/transfers", icon: "🔄" },
    { label: "Cancellations", href: "/cancellations", icon: "❌" },
    { label: "CRM Leads", href: "/crm", icon: "🎯" },
  ]},
  { section: "Finance", items: [
    { label: "Accounts", href: "/accounts", icon: "📒" },
    { label: "Billing", href: "/billing", icon: "🧾" },
  ]},
  { section: "Operations", items: [
    { label: "Complaints", href: "/complaints", icon: "🎫" },
    { label: "Construction", href: "/construction", icon: "🏗️" },
    { label: "Doc Control", href: "/documents", icon: "📁" },
  ]},
  { section: "People", items: [
    { label: "HRMS & Payroll", href: "/hrms", icon: "👥" },
    { label: "Tasks & Goals", href: "/tasks", icon: "✅" },
  ]},
  { section: "Land", items: [
    { label: "Land Records", href: "/land", icon: "🌾" },
    { label: "Balloting", href: "/balloting", icon: "🎲" },
  ]},
  { section: "Setup", items: [
    { label: "Projects", href: "/projects", icon: "🏢" },
    { label: "Plot Inventory", href: "/plot-inventory", icon: "📐" },
  ]},
  { section: "Reports", items: [
    { label: "All Reports", href: "/reports", icon: "📈" },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="sidebar fixed left-0 top-0 bottom-0 z-40 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-5">
          <h1 className="text-base font-bold">RealEstate ERP</h1>
          <p className="text-[10px] opacity-60">LadderERP / LadderCRM</p>
        </div>
        
        <nav className="space-y-3">
          {menuItems.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section">{section.section}</div>
              <div className="space-y-px">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "sidebar-item",
                      pathname === item.href && "active"
                    )}
                  >
                    <span className="text-sm w-5 text-center">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
      
      <div className="border-t border-white/10 p-3 shrink-0">
        <Link href="/" className="sidebar-item">
          <span className="text-sm w-5 text-center">⚙️</span>
          <span>Settings</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-item w-full text-left">
          <span className="text-sm w-5 text-center">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
