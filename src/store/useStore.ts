// src/store/useStore.ts - Fixed to use Record instead of Map
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
  // Cart state - Changed from Map to Record
  cart: Record<string, CartItem>;
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
        // Cart state - Initialize as empty object
        cart: {},
        
        addToCart: (productId, item) =>
          set((state) => {
            state.cart[productId] = item;
          }),
        
        updateCartItem: (productId, updates) =>
          set((state) => {
            if (state.cart[productId]) {
              state.cart[productId] = { ...state.cart[productId], ...updates };
            }
          }),
        
        removeFromCart: (productId) =>
          set((state) => {
            delete state.cart[productId];
          }),
        
        clearCart: () =>
          set((state) => {
            state.cart = {};
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
      }
    ),
    { name: 'procurechef-store' }
  )
);

// Computed selectors - Updated to work with Record
export const useCartTotal = () => {
  const cart = useStore((state) => state.cart);
  
  const cartItems = Object.values(cart);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  return { totalItems, totalPrice, itemCount: Object.keys(cart).length };
};

export const useCartItems = () => {
  const cart = useStore((state) => state.cart);
  return Object.entries(cart).map(([id, item]) => ({ id, ...item }));
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