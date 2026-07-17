"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type CartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
  image: string;
  slug: string;
  brand?: string;
  collection?: string;
};

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => Promise<void>;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lotten_cart");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignore parsing errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("lotten_cart", JSON.stringify(items));
    }
  }, [items, loading]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(async (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += item.quantity || 1;
        return newItems;
      } else {
        return [...prev, { ...item, quantity: item.quantity || 1 }];
      }
    });
  }, []);

  const updateQuantity = useCallback(async (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity < 0) return;

    setItems((prev) => {
      const index = prev.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
      );

      if (index === -1) return prev;

      if (quantity === 0) {
        return prev.filter((_, i) => i !== index);
      }

      const newItems = [...prev];
      newItems[index].quantity = quantity;
      return newItems;
    });
  }, []);

  const removeItem = useCallback(async (productId: string, variantId?: string) => {
    setItems((prev) => prev.filter(
      (i) => i.productId !== productId || i.variantId !== variantId
    ));
  }, []);

  const clearCart = useCallback(async () => {
    setItems([]);
  }, []);

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    isOpen,
    openCart,
    closeCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}