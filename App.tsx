
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import BatchManager from './components/BatchManager';
import ExpenseTracker from './components/ExpenseTracker';
import SalesTracker from './components/SalesTracker';
import MortalityTracker from './components/MortalityTracker';
import CustomerLedger from './components/CustomerLedger';
import BackupManager from './components/BackupManager';
import { storageService, COLLECTIONS } from './services/storageService';
import { Batch, Expense, Sale, Mortality, Customer, PaymentRecord, ExpensePayment } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ledgerTargetId, setLedgerTargetId] = useState<string | null>(null);
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensePayments, setExpensePayments] = useState<ExpensePayment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [mortality, setMortality] = useState<Mortality[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const loadAllData = () => {
    setBatches(storageService.getData(COLLECTIONS.BATCHES));
    setExpenses(storageService.getData(COLLECTIONS.EXPENSES));
    setExpensePayments(storageService.getData(COLLECTIONS.EXPENSE_PAYMENTS));
    setSales(storageService.getData(COLLECTIONS.SALES));
    setMortality(storageService.getData(COLLECTIONS.MORTALITY));
    setCustomers(storageService.getData(COLLECTIONS.CUSTOMERS));
    setPayments(storageService.getData(COLLECTIONS.PAYMENTS));
  };

  useEffect(() => {
    loadAllData();
    const unsub = storageService.subscribe(loadAllData);
    return unsub;
  }, []);

  const handleSaveBatch = async (batch: Batch) => {
    await storageService.saveItem(COLLECTIONS.BATCHES, batch);
  };

  const handleDeleteBatch = async (id: string) => {
    if (confirm('Delete batch and all its records?')) {
      await storageService.deleteBatch(id);
    }
  };

  const handleSaveExpense = async (expense: Expense, initialPaidAmount?: number) => {
    await storageService.saveItem(COLLECTIONS.EXPENSES, expense);
    if (initialPaidAmount && initialPaidAmount > 0) {
      const payment: ExpensePayment = {
        id: `exp-pay-init-${expense.id}`,
        expenseId: expense.id,
        date: expense.date,
        amount: initialPaidAmount,
        notes: 'Initial payment'
      };
      await storageService.saveItem(COLLECTIONS.EXPENSE_PAYMENTS, payment);
    }
  };

  const handleSaveExpensePayment = async (payment: ExpensePayment) => {
    await storageService.saveItem(COLLECTIONS.EXPENSE_PAYMENTS, payment);
  };

  const handleDeleteExpensePayment = async (id: string) => {
    if (confirm('Delete this payment record?')) {
      await storageService.deleteItem(COLLECTIONS.EXPENSE_PAYMENTS, id);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Delete this expense?')) {
      await storageService.deleteItem(COLLECTIONS.EXPENSES, id);
    }
  };

  const handleSaveSale = async (sale: Sale, customer: Customer) => {
    const normalizedCustomer = { ...customer, name: customer.name.trim() };
    const finalSale = {
      ...sale,
      customerName: normalizedCustomer.name,
      customerId: normalizedCustomer.id,
      invoiceNo: sale.invoiceNo || `INV-${Date.now().toString().slice(-6)}`
    };

    await storageService.saveItem(COLLECTIONS.CUSTOMERS, normalizedCustomer);
    await storageService.saveItem(COLLECTIONS.SALES, finalSale);
    
    if (finalSale.paidAmount > 0) {
      const initPayment: PaymentRecord = {
        id: `pay-init-${finalSale.id}`,
        customerId: normalizedCustomer.id,
        saleId: finalSale.id,
        date: finalSale.date,
        amount: finalSale.paidAmount,
        notes: `Initial payment for ${finalSale.invoiceNo}`
      };
      await storageService.saveItem(COLLECTIONS.PAYMENTS, initPayment);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm('Delete this sale record?')) {
      await storageService.deleteItem(COLLECTIONS.SALES, id);
    }
  };

  const handleSavePayment = async (payment: PaymentRecord) => {
    await storageService.saveItem(COLLECTIONS.PAYMENTS, payment);
  };

  const handleDeletePayment = async (id: string) => {
    if (confirm('Delete this payment record?')) {
      await storageService.deleteItem(COLLECTIONS.PAYMENTS, id);
    }
  };

  const handleSaveMortality = async (record: Mortality) => {
    await storageService.saveItem(COLLECTIONS.MORTALITY, record);
  };

  const handleDeleteMortality = async (id: string) => {
    if (confirm('Delete this mortality record?')) {
      await storageService.deleteItem(COLLECTIONS.MORTALITY, id);
    }
  };

  const handleAddInitialExpense = (batchId: string, amount: number, date: string) => {
    handleSaveExpense({
      id: `init-${batchId}`,
      batchId,
      date,
      type: 'Chicks',
      amount,
      notes: 'Initial chick purchase cost'
    }, amount);
  };

  const handleViewLedger = (customerId: string) => {
    setLedgerTargetId(customerId);
    setActiveTab('ledger');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard batches={batches} expenses={expenses} sales={sales} mortality={mortality} />;
      case 'batches':
        return <BatchManager batches={batches} onSaveBatch={handleSaveBatch} onDeleteBatch={handleDeleteBatch} onAddInitialExpense={handleAddInitialExpense} />;
      case 'expenses':
        return <ExpenseTracker expenses={expenses} expensePayments={expensePayments} batches={batches} onSaveExpense={handleSaveExpense} onDeleteExpense={handleDeleteExpense} onSaveExpensePayment={handleSaveExpensePayment} onDeleteExpensePayment={handleDeleteExpensePayment} />;
      case 'ledger':
        return <CustomerLedger customers={customers} sales={sales} payments={payments} batches={batches} initialCustomerId={ledgerTargetId} onSavePayment={handleSavePayment} onDeletePayment={handleDeletePayment} onClearTarget={() => setLedgerTargetId(null)} />;
      case 'mortality':
        return <MortalityTracker mortalityRecords={mortality} batches={batches} onSaveMortality={handleSaveMortality} onDeleteMortality={handleDeleteMortality} />;
      case 'sales':
        return <SalesTracker sales={sales} batches={batches} customers={customers} payments={payments} onSaveSale={handleSaveSale} onDeleteSale={handleDeleteSale} onViewLedger={handleViewLedger} />;
      case 'backup':
        return <BackupManager onRefresh={() => {}} />;
      default:
        return <Dashboard batches={batches} expenses={expenses} sales={sales} mortality={mortality} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
