import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function generateRegNo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `REG-${yr}${mo}-${rand}`;
}

function generateBookingNo(): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `BKG-${yr}${mo}-${rand}`;
}

function generateReceiptNo(seq: number): string {
  const now = new Date();
  const yr = now.getFullYear().toString().slice(-2);
  const mo = (now.getMonth() + 1).toString().padStart(2, '0');
  return `RCP-${yr}${mo}-${String(seq).padStart(5, '0')}`;
}

async function main() {
  console.log('Clearing existing data...');
  
  // Clear in order (respect foreign keys)
  await prisma.refund.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.cancellation.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.paymentPlan.deleteMany();
  await prisma.filePartnership.deleteMany();
  await prisma.file.deleteMany();
  await prisma.unitStatusHistory.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.block.deleteMany();
  await prisma.project.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.followup.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.complaintRemark.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.employeeDependent.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.landRecord.deleteMany();
  await prisma.ballotEvent.deleteMany();
  await prisma.ballotApplicant.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.voucherEntry.deleteMany();
  await prisma.billingSchedule.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.billPayment.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.gRN.deleteMany();
  await prisma.client.deleteMany();
  await prisma.dealer.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.call.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.company.deleteMany();
  await prisma.department.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.chartOfAccount.deleteMany();
  await prisma.postingPeriod.deleteMany();
  await prisma.complaintCategory.deleteMany();
  await prisma.leaveType.deleteMany();
  await prisma.loanType.deleteMany();
  await prisma.messageLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.merge.deleteMany();
  await prisma.bmmsRegistration.deleteMany();
  await prisma.bOQItem.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.purchaseDemand.deleteMany();
  await prisma.storeStock.deleteMany();
  await prisma.stockIssue.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.documentTag.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.leadScore.deleteMany();
  await prisma.closeLeadRequest.deleteMany();
  await prisma.billPayment.deleteMany();

  console.log('Data cleared. Seeding fresh data...');

  // ── Roles ──
  const superAdminRole = await prisma.role.create({ data: { name: 'super_admin', description: 'Full system access', permissions: JSON.stringify(['*']) } });
  const salesRole = await prisma.role.create({ data: { name: 'sales_executive', description: 'Sales operations', permissions: JSON.stringify(['read', 'write']) } });
  const accountsRole = await prisma.role.create({ data: { name: 'accounts_officer', description: 'Financial operations', permissions: JSON.stringify(['read', 'write']) } });

  // ── Company ──
  const company = await prisma.company.create({
    data: { name: 'HE Technologies', code: 'HE001', address: 'Lahore, Pakistan', phone: '+92 42 12345678', email: 'info@hetechnologies.com' },
  });

  // ── Users ──
  const password = await bcrypt.hash('admin123', 12);
  await prisma.user.create({ data: { email: 'admin@he.com', username: 'admin', passwordHash: password, firstName: 'Admin', lastName: 'User', roleId: superAdminRole.id } });
  await prisma.user.create({ data: { email: 'sales@he.com', username: 'sales', passwordHash: password, firstName: 'Ahmad', lastName: 'Raza', roleId: salesRole.id } });

  // ── Departments & Designations ──
  const deptNames = ['Sales', 'Accounts', 'Construction', 'HR', 'CRM'];
  for (const d of deptNames) await prisma.department.create({ data: { name: d, code: d.toUpperCase().slice(0, 3) } });
  const desNames = ['Manager', 'Officer', 'Executive', 'Engineer'];
  for (const d of desNames) await prisma.designation.create({ data: { name: d } });

  // ── Complaint Categories ──
  for (const cat of ['Electricity', 'Water', 'Security', 'Construction', 'Plumbing']) {
    await prisma.complaintCategory.create({ data: { name: cat } });
  }

  // ── Chart of Accounts ──
  const accData = [
    { code: '1000', name: 'Cash', type: 'asset' }, { code: '1100', name: 'Bank - HBL', type: 'asset' },
    { code: '1300', name: 'Accounts Receivable', type: 'asset' }, { code: '2000', name: 'Accounts Payable', type: 'liability' },
    { code: '4000', name: 'Sales Revenue', type: 'revenue' }, { code: '5000', name: 'Cost of Land', type: 'expense' },
  ];
  for (const a of accData) await prisma.chartOfAccount.create({ data: a });

  // ── Leave/Loan Types ──
  for (const lt of [{ name: 'annual', daysPerYear: 20 }, { name: 'casual', daysPerYear: 10 }, { name: 'sick', daysPerYear: 8 }]) {
    await prisma.leaveType.create({ data: lt });
  }
  for (const lt of [{ name: 'Personal Loan', maxAmount: 200000, maxInstallments: 24 }, { name: 'Emergency Loan', maxAmount: 100000, maxInstallments: 12 }]) {
    await prisma.loanType.create({ data: lt });
  }

  // ── Dealers ──
  const dealer1 = await prisma.dealer.create({ data: { name: 'Alpha Realty', phone: '+92 300 1111111', commissionSlab: '2%' } });
  const dealer2 = await prisma.dealer.create({ data: { name: 'Beta Properties', phone: '+92 321 2222222', commissionSlab: '2.5%' } });

  // ── Projects ──
  const projectData = [
    { name: 'Green Valley', code: 'GV001', type: 'residential', location: 'Lahore DHA Phase 5' },
    { name: 'Blue Heights', code: 'BH001', type: 'commercial', location: 'Karachi Clifton' },
    { name: 'Sunset Heights', code: 'SH001', type: 'residential', location: 'Islamabad F-10' },
    { name: 'Lake View', code: 'LV001', type: 'mixed', location: 'Rawalpindi Bahria Town' },
  ];

  const projects = [];
  for (const pd of projectData) {
    const p = await prisma.project.create({ data: { ...pd, companyId: company.id } });
    projects.push(p);
  }

  // ── Blocks & Units ──
  const blockConfigs = [
    { projectIdx: 0, blocks: ['A', 'B', 'C'], plotsPerBlock: 40, basePrice: 8500000, size: 10, sizeUnit: 'marla' },
    { projectIdx: 1, blocks: ['Commercial'], plotsPerBlock: 25, basePrice: 25000000, size: 2000, sizeUnit: 'sqft' },
    { projectIdx: 2, blocks: ['A', 'B'], plotsPerBlock: 30, basePrice: 12000000, size: 15, sizeUnit: 'marla' },
    { projectIdx: 3, blocks: ['A', 'B'], plotsPerBlock: 35, basePrice: 6500000, size: 5, sizeUnit: 'kanal' },
  ];

  const allUnits: any[] = [];
  for (const bc of blockConfigs) {
    for (const blockLetter of bc.blocks) {
      const block = await prisma.block.create({
        data: { projectId: projects[bc.projectIdx].id, name: `Block ${blockLetter}` },
      });
      for (let i = 1; i <= bc.plotsPerBlock; i++) {
        const priceVariation = 1 + (Math.random() * 0.3 - 0.15); // ±15%
        const unit = await prisma.unit.create({
          data: {
            blockId: block.id,
            plotNo: String(i),
            category: i <= bc.plotsPerBlock * 0.8 ? 'residential' : 'commercial',
            size: Math.round(bc.size + (Math.random() * 2 - 1)),
            sizeUnit: bc.sizeUnit,
            price: Math.round(bc.basePrice * priceVariation / 1000) * 1000,
            status: 'available',
          },
        });
        allUnits.push({ ...unit, projectName: projects[bc.projectIdx].name });
      }
    }
  }

  // ── Clients ──
  const clientData = [
    { name: 'Ahmed Khan', cnic: '35202-1234567-1', phone: '+92 300 1234567', email: 'ahmed.khan@email.com' },
    { name: 'Sara Malik', cnic: '35202-2345678-2', phone: '+92 301 2345678', email: 'sara.malik@email.com' },
    { name: 'Hassan Ali', cnic: '42101-3456789-3', phone: '+92 302 3456789', email: 'hassan.ali@email.com' },
    { name: 'Fatima Noor', cnic: '35202-4567890-4', phone: '+92 333 4567890', email: 'fatima.noor@email.com' },
    { name: 'Usman Ghani', cnic: '42101-5678901-5', phone: '+92 300 5678901', email: 'usman.ghani@email.com' },
    { name: 'Ayesha Siddiqui', cnic: '35202-6789012-6', phone: '+92 301 6789012', email: 'ayesha.s@email.com' },
    { name: 'Bilal Shah', cnic: '42101-7890123-7', phone: '+92 302 7890123', email: 'bilal.shah@email.com' },
    { name: 'Zainab Ahmed', cnic: '35202-8901234-8', phone: '+92 333 8901234', email: 'zainab.a@email.com' },
    { name: 'Omar Farooq', cnic: '42101-9012345-9', phone: '+92 300 9012345', email: 'omar.f@email.com' },
    { name: 'Hira Saleem', cnic: '35202-0123456-0', phone: '+92 301 0123456', email: 'hira.s@email.com' },
  ];

  const clients = [];
  for (let i = 0; i < clientData.length; i++) {
    const cd = clientData[i];
    const now = new Date();
    const yr = now.getFullYear().toString().slice(-2);
    const mo = (now.getMonth() + 1).toString().padStart(2, '0');
    const num = (i + 1).toString().padStart(4, '0');
    const c = await prisma.client.create({ data: { ...cd, source: 'referral', regNo: `CLI-${yr}${mo}-${num}` } });
    clients.push(c);
  }

  // ── Bookings (Files + Payment Plans + Installments) ──
  let receiptSeq = 1;
  const now = new Date();

  const bookingConfigs = [
    { clientIdx: 0, unitIdx: 0, downPaymentPct: 0.10, instCount: 12, paymentsMade: 3 },  // Ahmed Khan - 3 payments
    { clientIdx: 1, unitIdx: 5, downPaymentPct: 0.15, instCount: 12, paymentsMade: 6 },  // Sara Malik - 6 payments
    { clientIdx: 2, unitIdx: 15, downPaymentPct: 0.10, instCount: 24, paymentsMade: 1 }, // Hassan Ali - 1 payment
    { clientIdx: 3, unitIdx: 45, downPaymentPct: 0.20, instCount: 12, paymentsMade: 12 }, // Fatima Noor - FULLY PAID
    { clientIdx: 4, unitIdx: 50, downPaymentPct: 0.10, instCount: 12, paymentsMade: 0 },  // Usman Ghani - no payments
    { clientIdx: 5, unitIdx: 80, downPaymentPct: 0.15, instCount: 12, paymentsMade: 4 },  // Ayesha Siddiqui - 4 payments
    { clientIdx: 6, unitIdx: 100, downPaymentPct: 0.10, instCount: 24, paymentsMade: 2 },  // Bilal Shah - 2 payments
    { clientIdx: 7, unitIdx: 120, downPaymentPct: 0.25, instCount: 12, paymentsMade: 8 },  // Zainab Ahmed - 8 payments
    { clientIdx: 8, unitIdx: 140, downPaymentPct: 0.10, instCount: 12, paymentsMade: 0 },  // Omar Farooq - no payments
    { clientIdx: 9, unitIdx: 160, downPaymentPct: 0.15, instCount: 12, paymentsMade: 5 },  // Hira Saleem - 5 payments
  ];

  for (const bc of bookingConfigs) {
    const client = clients[bc.clientIdx];
    const unit = allUnits[bc.unitIdx];
    if (!unit) continue;

    const unitPrice = Number(unit.price);
    const downPayment = Math.round(unitPrice * bc.downPaymentPct);
    const totalAmount = unitPrice;
    const perInst = (totalAmount - downPayment) / bc.instCount;

    // Create file (booking)
    const file = await prisma.file.create({
      data: {
        regNo: generateRegNo(),
        bookingNo: generateBookingNo(),
        clientId: client.id,
        projectId: unit.projectName === 'Green Valley' ? projects[0].id :
                   unit.projectName === 'Blue Heights' ? projects[1].id :
                   unit.projectName === 'Sunset Heights' ? projects[2].id : projects[3].id,
        unitId: unit.id,
        status: bc.paymentsMade >= bc.instCount ? 'completed' : 'active',
        createdBy: 'system',
      },
    });

    // Mark unit as booked
    await prisma.unit.update({ where: { id: unit.id }, data: { status: 'booked' } });

    // Create payment plan
    const plan = await prisma.paymentPlan.create({
      data: {
        fileId: file.id,
        planType: 'standard',
        totalAmount,
        downPayment,
      },
    });

    // Create installments
    const installments = [];
    for (let i = 1; i <= bc.instCount; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      const inst = await prisma.installment.create({
        data: { planId: plan.id, instNo: i, dueDate, dueAmount: perInst, paidAmount: 0, status: 'pending' },
      });
      installments.push(inst);
    }

    // Apply payments to installments
    let remaining = downPayment; // Down payment is the first payment
    const totalToPay = downPayment + perInst * bc.paymentsMade;
    remaining = totalToPay;

    // Down payment goes to first installment
    for (const inst of installments) {
      if (remaining <= 0) break;
      const due = Number(inst.dueAmount);
      const toPay = Math.min(remaining, due);
      const newStatus = toPay >= due ? 'paid' : 'partial';
      await prisma.installment.update({
        where: { id: inst.id },
        data: { paidAmount: toPay, status: newStatus },
      });
      remaining -= toPay;
    }

    // Create receipts for each payment
    for (let i = 0; i < bc.paymentsMade; i++) {
      const payDate = new Date(now);
      payDate.setMonth(payDate.getMonth() - (bc.paymentsMade - i));

      await prisma.receipt.create({
        data: {
          receiptNo: generateReceiptNo(receiptSeq++),
          fileId: file.id,
          amount: i === 0 ? downPayment : perInst,
          mode: ['cash', 'cheque', 'online'][i % 3] as any,
          receivedBy: 'system',
          receivedAt: payDate,
        },
      });
    }
  }

  // ── CRM Leads ──
  const leadNames = [
    { name: 'Kamran Bhatti', phone: '+92 300 1111001', source: 'walk_in', status: 'new' },
    { name: 'Nadia Iqbal', phone: '+92 301 2222002', source: 'referral', status: 'contacted' },
    { name: 'Tariq Mehmood', phone: '+92 302 3333003', source: 'website', status: 'qualified' },
    { name: 'Rabia Aslam', phone: '+92 333 4444004', source: 'call', status: 'new' },
    { name: 'Faisal Naveed', phone: '+92 300 5555005', source: 'walk_in', status: 'contacted' },
  ];

  for (const ld of leadNames) {
    await prisma.lead.create({
      data: { ...ld, email: null, assignedTo: null, notes: null },
    });
  }

  // ── Complaints ──
  const cats = await prisma.complaintCategory.findMany();
  const compFile = await prisma.file.findFirst({ where: { status: 'active' } });
  if (compFile && cats.length > 0) {
    const compClient = await prisma.client.findFirst({ where: { id: compFile.clientId } });
    const memberName = compClient?.name || 'Unknown';
    await prisma.complaint.create({
      data: { fileId: compFile.id, categoryId: cats[0].id, ticketNo: 'TKT-2607-00001', memberName, blockHouseNo: 'Block A-15', priority: 'Medium', details: 'Street light not working in Block A', status: 'new' },
    });
    await prisma.complaint.create({
      data: { fileId: compFile.id, categoryId: cats[2].id, ticketNo: 'TKT-2607-00002', memberName, blockHouseNo: 'Block B-22', priority: 'High', details: 'Security guard missing from main gate', status: 'in_progress' },
    });
  }

  console.log('Fresh database seeded successfully!');
  console.log(`  - ${projects.length} projects`);
  console.log(`  - ${blockConfigs.reduce((s, b) => s + b.blocks.length, 0)} blocks`);
  console.log(`  - ${allUnits.length} units`);
  console.log(`  - ${clients.length} clients`);
  console.log(`  - ${bookingConfigs.length} bookings`);
  console.log(`  - ${receiptSeq - 1} receipts`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
