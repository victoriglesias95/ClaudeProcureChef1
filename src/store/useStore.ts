// src/store/useStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { productsService, ordersService } from '../services/unified-data-services';

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
  products: StoreProduct[];
  setProducts: (products: StoreProduct[]) => void;
  
  // Orders state
  orders: StoreOrder[];
  setOrders: (orders: StoreOrder[]) => void;
  addOrder: (order: StoreOrder) => void;
  updateOrder: (orderId: string, updates: Partial<StoreOrder>) => void;
  
  // Requests state
  requests: StoreRequest[];
  setRequests: (requests: StoreRequest[]) => void;
  updateRequest: (requestId: string, updates: Partial<StoreRequest>) => void;
}

interface CartItem {
  quantity: number;
  price: number;
  name: string;
  currentStock?: number;
  stockLevel?: 'low' | 'medium' | 'high';
}

// Store-specific types (to avoid conflicts with service types)
interface StoreProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface StoreOrder {
  id: string;
  number: string;
  status: string;
  total: number;
  items: any[];
}

interface StoreRequest {
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
            const index = state.orders.findIndex((o: StoreOrder) => o.id === orderId);
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
            const index = state.requests.findIndex((r: StoreRequest) => r.id === requestId);
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
      
      const serviceProducts = await productsService.getAll();
      // Convert service products to store products
      const storeProducts: StoreProduct[] = serviceProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: 10, // Default price since service Product doesn't have price
        stock: 0   // Default stock since service Product doesn't have stock
      }));
      setProducts(storeProducts);
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
      
      const serviceOrder = await ordersService.create({
        ...orderData,
        items: [] // Ensure items array exists
      });
      
      if (serviceOrder) {
        // Convert service order to store order
        const storeOrder: StoreOrder = {
          id: serviceOrder.id,
          number: serviceOrder.number,
          status: serviceOrder.status,
          total: serviceOrder.total,
          items: serviceOrder.items || []
        };
        addOrder(storeOrder);
        clearCart();
        return storeOrder;
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