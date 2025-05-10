// src/types/quote.ts

import { RequestItem, RequestPriority, RequestStatus } from './request';

// Quote status types
export type QuoteStatus = 'draft' | 'sent' | 'received' | 'approved' | 'rejected' | 'processed';

// Quote item representing a product in a quote
export type QuoteItem = {
  id: string;
  request_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  in_stock: boolean;
  notes?: string;
  approved?: boolean;
  supplier_product_code?: string;
  package_conversion?: {
    supplier_unit: string;
    supplier_unit_size: number;
    supplier_unit_price: number;
  };
};

// Main quote from a supplier
export type SupplierQuote = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  request_id: string;
  created_at: string;
  expiry_date?: string;
  status: QuoteStatus;
  delivery_date?: string;
  items: QuoteItem[];
  total_amount: number;
  notes?: string;
};

// For backward compatibility
export type Quote = SupplierQuote;

// Supplier information
export type Supplier = {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  deliveryDays?: string[];
  minimumOrder?: number;
  notes?: string;
};

// Group of quotes from different suppliers for the same request
export type QuoteComparison = {
  id: string;
  request_id: string;
  request: any; // Using 'any' for now, but should be request type
  supplier_quotes: SupplierQuote[];
  created_at: string;
  status: 'open' | 'processed';
};

// Product-centered quote comparison
export type ProductQuoteComparison = {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  sku?: string;
  requestIds: string[];
  quantity: number;
  supplierQuotes: SupplierProductQuote[];
  selectedSupplierId?: string;
};

// Supplier quote for a specific product
export type SupplierProductQuote = {
  supplierId: string;
  supplierName: string;
  price: number;
  inStock: boolean;
  supplierProductCode?: string;
  minimumOrderQuantity?: number;
  packageConversion?: {
    supplierUnit: string;
    supplierUnitSize: number;
    supplierUnitPrice: number;
  };
};

// Selected item for order creation
export type SelectedQuoteItem = {
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  unit: string;
  price: number;
  supplierProductCode?: string;
  sku?: string;
};

// Order type for order creation
export type Order = {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  deliveryDate?: string;
  items: OrderItem[];
  total: number;
  notes?: string;
};

// Order item type
export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  supplierProductCode?: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  notes?: string;
};