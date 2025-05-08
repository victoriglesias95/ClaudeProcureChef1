export type Product = {
    id: string;
    name: string;
    description: string | null;
    category: string;
    default_unit: string;
    created_at: string;
  };
  
  export type InventoryItem = Product & {
    stock_level: 'low' | 'medium' | 'high';
    current_stock: number;
    last_updated: string;
  };
  
  export type ProductCategory = {
    name: string;
    items: InventoryItem[];
  };