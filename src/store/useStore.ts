// src/store/useStore.ts - Clean architecture: Cart + UI state only
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface CartItem {
  quantity: number;
  price: number;
  name: string;
  unit: string;
  currentStock?: number;
  stockLevel?: 'low' | 'medium' | 'high';
}

interface AppState {
  // Cart state
  cart: Map<string, CartItem>;
  addToCart: (productId: string, item: CartItem) => void;
  updateCartItem: (productId: string, updates: Partial<CartItem>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  activeModal: string | null;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist(
      immer((set) => ({
        // Cart state
        cart: new Map(),
        
        addToCart: (productId, item) =>
          set((state) => {
            state.cart.set(productId, item);
          }),
        
        updateCartItem: (productId, updates) =>
          set((state) => {
            const existingItem = state.cart.get(productId);
            if (existingItem) {
              state.cart.set(productId, { ...existingItem, ...updates });
            }
          }),
        
        removeFromCart: (productId) =>
          set((state) => {
            state.cart.delete(productId);
          }),
        
        clearCart: () =>
          set((state) => {
            state.cart.clear();
          }),
        
        // UI state
        isLoading: false,
        error: null,
        activeModal: null,
        
        // UI actions
        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),
        
        setError: (error) =>
          set((state) => {
            state.error = error;
          }),
        
        openModal: (modalId) =>
          set((state) => {
            state.activeModal = modalId;
          }),
        
        closeModal: () =>
          set((state) => {
            state.activeModal = null;
          }),
      })),
      {
        name: 'procurechef-storage',
        partialize: (state) => ({ 
          cart: Array.from(state.cart.entries()) // Convert Map to Array for persistence
        }),
        onRehydrateStorage: () => (state) => {
          // Convert Array back to Map after rehydration
          if (state && Array.isArray(state.cart)) {
            state.cart = new Map(state.cart as [string, CartItem][]);
          }
        },
      }
    ),
    { name: 'procurechef-store' }
  )
);

// Computed selectors
export const useCartTotal = () => {
  const cart = useStore((state) => state.cart);
  
  const cartItems = Array.from(cart.values());
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  return { totalItems, totalPrice, itemCount: cart.size };
};

export const useCartItems = () => {
  const cart = useStore((state) => state.cart);
  return Array.from(cart.entries()).map(([id, item]) => ({ id, ...item }));
};

// UI helpers
export const useModal = (modalId: string) => {
  const activeModal = useStore((state) => state.activeModal);
  const openModal = useStore((state) => state.openModal);
  const closeModal = useStore((state) => state.closeModal);
  
  return {
    isOpen: activeModal === modalId,
    open: () => openModal(modalId),
    close: closeModal,
  };
};