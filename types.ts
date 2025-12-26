
export type ExpenseType = 'Chicks' | 'Feed' | 'Medicine' | 'Labour' | 'Electricity' | 'Transport' | 'Litter' | 'Other';

export type PaymentStatus = 'PAID' | 'PARTIALLY PAID' | 'UNPAID';

export interface Batch {
  id: string;
  name: string;
  startDate: string;
  expectedEndDate: string;
  numChicks: number;
  chickRate: number;
  totalChickCost: number;
  supplier?: string;
  remarks?: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  batchId: string;
  date: string;
  type: ExpenseType;
  amount: number; // Total Bill Amount
  notes?: string;
}

export interface ExpensePayment {
  id: string;
  expenseId: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  batchId: string;
  customerId: string;
  customerName: string;
  date: string;
  birdsSold: number;
  totalWeight: number;
  ratePerKg: number;
  totalSaleAmount: number;
  paidAmount: number; // Initial payment during sale
  balanceDue: number;
  paymentStatus: PaymentStatus;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  saleId?: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface Mortality {
  id: string;
  batchId: string;
  date: string;
  count: number;
  reason?: string;
}

export interface BatchSummary {
  id: string;
  name: string;
  totalExpenses: number;
  totalSales: number;
  totalWeight: number;
  chickCost: number;
  netProfit: number;
  numChicks: number;
  totalMortality: number;
}
