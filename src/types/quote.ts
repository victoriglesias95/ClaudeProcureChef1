// Types for quote management in the procurement system

export type RequestPriority = 'low' | 'medium' | 'high';

export type RequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';

export type RequestItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
};

export type Request = {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  needed_by?: string;
  priority: RequestPriority;
  notes?: string;
  status: RequestStatus;
  items: RequestItem[];
  total_amount: number;
};

export type QuoteStatus = 'draft' | 'sent' | 'received' | 'processed';

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
  approved: boolean;
};

export type SupplierQuote = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  request_id: string;
  created_at: string;
  status: QuoteStatus;
  items: QuoteItem[];
  total_amount: number;
};

// Group of quotes from different suppliers for the same request
export type QuoteComparison = {
  id: string;
  request_id: string;
  request: Request;
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
  requestIds: string[]; // Track which requests contain this product
  quantity: number;
  supplierQuotes: SupplierProductQuote[];
  selectedSupplierId?: string;
};

export type SupplierProductQuote = {
  supplierId: string;
  supplierName: string;
  price: number;
  inStock: boolean;
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
};