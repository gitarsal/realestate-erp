import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  cnic: z.string().length(13, 'CNIC must be 13 digits').regex(/^\d+$/, 'CNIC must contain only digits'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  category: z.string().optional(),
  source: z.string().optional(),
});

export const bookingSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  projectId: z.string().min(1, 'Project is required'),
  unitId: z.string().min(1, 'Unit is required'),
  planType: z.enum(['standard', 'customized']),
  downPayment: z.number().min(0, 'Down payment must be positive'),
  rebateAmount: z.number().min(0).optional(),
  totalAmount: z.number().positive('Total amount must be positive'),
});

export const receiptSchema = z.object({
  fileId: z.string().min(1, 'File is required'),
  installmentId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  mode: z.enum(['cash', 'cheque', 'pay_order', 'online', 'bank']),
  instrumentNo: z.string().optional(),
  narration: z.string().optional(),
});

export const transferSchema = z.object({
  fileId: z.string().min(1, 'File is required'),
  toClientId: z.string().min(1, 'Transferee is required'),
  fee: z.number().min(0, 'Fee must be positive'),
});

export const cancellationSchema = z.object({
  fileId: z.string().min(1, 'File is required'),
  reason: z.string().min(1, 'Reason is required'),
});

export const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  projectId: z.string().optional(),
  budget: z.number().optional(),
  leadType: z.string().optional(),
  source: z.string().default('manual'),
  dealerId: z.string().optional(),
  notes: z.string().optional(),
});

export const voucherSchema = z.object({
  type: z.enum(['payment', 'receipt', 'journal', 'sales', 'refund', 'adjustment', 'expense']),
  date: z.string().min(1, 'Date is required'),
  narration: z.string().optional(),
  entries: z.array(z.object({
    accountId: z.string().min(1, 'Account is required'),
    debit: z.number().min(0),
    credit: z.number().min(0),
    narration: z.string().optional(),
  })).min(2, 'At least 2 entries required'),
}).refine(
  (data) => {
    const totalDebit = data.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = data.entries.reduce((sum, e) => sum + e.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01;
  },
  { message: 'Total debits must equal total credits' }
);

export const complaintSchema = z.object({
  clientName: z.string().min(1, 'Member name is required'),
  blockHouseNo: z.string().min(1, 'Block/House No is required'),
  categoryId: z.string().min(1, 'Category is required'),
  details: z.string().min(10, 'Details must be at least 10 characters'),
  availableTime: z.string().optional(),
  clientId: z.string().optional(),
  fileId: z.string().optional(),
});

export const employeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  cnic: z.string().length(13, 'CNIC must be 13 digits'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  departmentId: z.string().min(1, 'Department is required'),
  designationId: z.string().min(1, 'Designation is required'),
  joinDate: z.string().min(1, 'Join date is required'),
  salary: z.number().positive('Salary must be positive'),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});