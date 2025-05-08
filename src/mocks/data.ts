import { Product, InventoryItem } from '../types/product';

// Mock products data
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Tomatoes',
    description: 'Fresh organic tomatoes',
    category: 'Vegetables',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Potatoes',
    description: 'Idaho potatoes, great for frying',
    category: 'Vegetables',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Onions',
    description: 'Yellow onions',
    category: 'Vegetables',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Bell Peppers',
    description: 'Mixed colors',
    category: 'Vegetables',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Chicken Breast',
    description: 'Boneless, skinless',
    category: 'Meat',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Ground Beef',
    description: '80/20 lean to fat ratio',
    category: 'Meat',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Salmon Fillet',
    description: 'Atlantic salmon',
    category: 'Seafood',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Milk',
    description: 'Whole milk',
    category: 'Dairy',
    default_unit: 'L',
    created_at: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Cheddar Cheese',
    description: 'Sharp cheddar',
    category: 'Dairy',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '10',
    name: 'Flour',
    description: 'All-purpose flour',
    category: 'Baking',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '11',
    name: 'Rice',
    description: 'Long grain white rice',
    category: 'Grains',
    default_unit: 'kg',
    created_at: new Date().toISOString()
  },
  {
    id: '12',
    name: 'Olive Oil',
    description: 'Extra virgin',
    category: 'Oils',
    default_unit: 'L',
    created_at: new Date().toISOString()
  }
];

// Mock category price information
export const mockCategoryPrices: Record<string, {price: number, originalPrice?: number}> = {
  'Vegetables': {price: 12.99, originalPrice: 16.50},
  'Meat': {price: 25.99, originalPrice: 32.99},
  'Dairy': {price: 8.99},
  'Seafood': {price: 34.99, originalPrice: 42.50},
  'Grains': {price: 6.99},
  'Baking': {price: 9.99, originalPrice: 11.99},
  'Oils': {price: 15.99},
};

// Helper function to generate random stock level
export function getRandomStockLevel(): 'low' | 'medium' | 'high' {
  const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
  return levels[Math.floor(Math.random() * levels.length)];
}

// Helper to generate inventory items with mock stock levels
export function generateMockInventoryItems(products: Product[]): InventoryItem[] {
  return products.map(product => ({
    ...product,
    stock_level: getRandomStockLevel(),
    current_stock: Math.floor(Math.random() * 100),
    last_updated: new Date().toISOString(),
  }));
}