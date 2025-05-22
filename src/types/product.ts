export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  default_unit: string;
  created_at: string;
  sku?: string; // Added sku property
};
  
export type InventoryItem = Product & {
  stock_level: 'low' | 'medium' | 'high';
  current_stock: number;
  last_updated: string;
  last_counted_at?: string;
};
  
export type ProductCategory = {
  name: string;
  items: InventoryItem[];
};