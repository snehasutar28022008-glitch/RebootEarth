import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type HazardLevel = 'none' | 'hazardous';
export type Recommendation = 'recycle' | 'repair' | 'donate';

export interface BasketItem {
  id: string;
  category: string;
  label: string;
  quantity: number;
  grade: 'A' | 'B' | 'C' | 'Hazardous';
  hazardLevel: HazardLevel;
  recommendation: Recommendation;
  handlingTip: string;
  hasBattery: boolean;
  photoUrl?: string;
  estimatedValueMin: number;
  estimatedValueMax: number;
  unit: 'per_kg' | 'per_item';
  isHighValue: boolean;
  source: 'mode1' | 'mode2' | 'manual';
}

interface BasketContextValue {
  items: BasketItem[];
  addItem: (item: BasketItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<BasketItem>) => void;
  clearBasket: () => void;
  totalItems: number;
  totalValueMin: number;
  totalValueMax: number;
  hasHazardous: boolean;
}

const BasketContext = createContext<BasketContextValue | undefined>(undefined);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);

  const addItem = useCallback((item: BasketItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<BasketItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const clearBasket = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValueMin = items.reduce((sum, item) => sum + item.estimatedValueMin * item.quantity, 0);
  const totalValueMax = items.reduce((sum, item) => sum + item.estimatedValueMax * item.quantity, 0);
  const hasHazardous = items.some((item) => item.hazardLevel === 'hazardous');

  return (
    <BasketContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateItem,
        clearBasket,
        totalItems,
        totalValueMin,
        totalValueMax,
        hasHazardous,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error('useBasket must be used within BasketProvider');
  return ctx;
}
