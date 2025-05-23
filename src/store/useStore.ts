// src/store/useStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  // Cart state
  cart: Map<string, CartItem>;
  addToCart: (productId: string, item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Products state
  products: Product[];
  setProducts: (products: Product[]) => void;
  
  // Orders state
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  
  // Requests state
  requests: Request[];
  setRequests: (requests: Request[]) => void;
  updateRequest: (requestId: string, updates: Partial<Request>) => void;
}

interface CartItem {
  quantity: number;
  price: number;
  name: string;
  currentStock?: number;
  stockLevel?: 'low' | 'medium' | 'high';
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface Order {
  id: string;
  number: string;
  status: string;
  total: number;
  items: any[];
}

interface Request {
  id: string;
  title: string;
  status: string;
  items: any[];
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        // Cart
        cart: new Map(),
        addToCart: (productId, item) =>
          set((state) => {
            state.cart.set(productId, item);
          }),
        removeFromCart: (productId) =>
          set((state) => {
            state.cart.delete(productId);
          }),
        clearCart: () =>
          set((state) => {
            state.cart.clear();
          }),
        
        // UI
        isLoading: false,
        error: null,
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),
        setError: (error) =>
          set((state) => {
            state.error = error;
          }),
        
        // Products
        products: [],
        setProducts: (products) =>
          set((state) => {
            state.products = products;
          }),
        
        // Orders
        orders: [],
        setOrders: (orders) =>
          set((state) => {
            state.orders = orders;
          }),
        addOrder: (order) =>
          set((state) => {
            state.orders.push(order);
          }),
        updateOrder: (orderId, updates) =>
          set((state) => {
            const index = state.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
              Object.assign(state.orders[index], updates);
            }
          }),
        
        // Requests
        requests: [],
        setRequests: (requests) =>
          set((state) => {
            state.requests = requests;
          }),
        updateRequest: (requestId, updates) =>
          set((state) => {
            const index = state.requests.findIndex(r => r.id === requestId);
            if (index !== -1) {
              Object.assign(state.requests[index], updates);
            }
          }),
      })),
      {
        name: 'procurechef-storage',
        partialize: (state) => ({ cart: state.cart }), // Only persist cart
      }
    )
  )
);

// Selectors for computed values
export const useCartTotal = () => {
  const cart = useStore((state) => state.cart);
  
  const totalItems = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  
  const totalPrice = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  
  return { totalItems, totalPrice };
};

// Async actions
export const actions = {
  async loadProducts() {
    const { setLoading, setError, setProducts } = useStore.getState();
    
    try {
      setLoading(true);
      setError(null);
      
      // Replace with your actual API call
      const products = await productsService.getAll();
      setProducts(products);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  },
  
  async createOrder(orderData: any) {
    const { setLoading, setError, addOrder, clearCart } = useStore.getState();
    
    try {
      setLoading(true);
      setError(null);
      
      // Replace with your actual API call
      const order = await ordersService.create(orderData);
      if (order) {
        addOrder(order);
        clearCart();
        return order;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create order');
      throw error;
    } finally {
      setLoading(false);
    }
  }
};

// React hooks for common patterns
export const useAsyncAction = <T extends any[], R>(
  action: (...args: T) => Promise<R>
) => {
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);
  
  return async (...args: T): Promise<R | undefined> => {
    try {
      setLoading(true);
      setError(null);
      return await action(...args);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  };
};