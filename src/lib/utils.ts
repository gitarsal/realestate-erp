import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateRegNo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `REG-${yr}${mo}-${rand}`;
}

export function generateBookingNo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `BKG-${yr}${mo}-${rand}`;
}

export function generateReceiptNo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `RCT-${yr}${mo}-${rand}`;
}

export function generateVoucherNo(type: string): string {
  const prefix = type.toUpperCase().slice(0, 3);
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `${prefix}-${yr}${mo}-${rand}`;
}

export function generateTicketNo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `TKT-${yr}${mo}-${rand}`;
}

export function generatePONo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `PO-${yr}${mo}-${rand}`;
}

export function generateGRNNo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `GRN-${yr}${mo}-${rand}`;
}

export function generateBillNo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `BILL-${yr}${mo}-${rand}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    hold: 'bg-yellow-100 text-yellow-800',
    booked: 'bg-orange-100 text-orange-800',
    sold: 'bg-red-100 text-red-800',
    possessed: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    new: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function paginate(page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize };
}