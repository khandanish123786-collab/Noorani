
import React from 'react';
import { ExpenseType } from './types';

export const EXPENSE_TYPES: ExpenseType[] = [
  'Chicks',
  'Feed',
  'Medicine',
  'Labour',
  'Electricity',
  'Transport',
  'Litter',
  'Other'
];

export const PAYMENT_STATUSES = ['PAID', 'PARTIALLY PAID', 'UNPAID'];

export const CURRENCY_SYMBOL = '₹';

export const COLORS = {
  primary: '#16a34a', // green-600
  secondary: '#15803d', // green-700
  accent: '#facc15', // yellow-400
  danger: '#dc2626', // red-600
  bg: '#f8fafc', // slate-50
};
