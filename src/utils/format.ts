// src/utils/format.ts - Formatting utilities
export const format = {
  currency(amount: number, currency = 'R$'): string {
    return `${currency}${amount.toFixed(2)}`;
  },
  
  date(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', options);
  },
  
  quantity(qty: number, unit: string): string {
    return `${qty} ${unit}${qty !== 1 ? 's' : ''}`;
  },
  
  percentage(value: number, decimals = 0): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }
};