import { create } from "zustand";

interface BookingFormUiState {
  step: 1 | 2;
  isPricingLoading: boolean;
  pricingVersion: number;

  setStep: (step: 1 | 2) => void;
  setPricingLoading: (loading: boolean) => void;
  bumpPricingVersion: () => void;
  reset: () => void;
}

export const useBookingFormUiStore = create<BookingFormUiState>()((set) => ({
  step: 1,
  isPricingLoading: false,
  pricingVersion: 0,

  setStep: (step) => set({ step }),
  setPricingLoading: (isPricingLoading) => set({ isPricingLoading }),
  bumpPricingVersion: () =>
    set((s) => ({ pricingVersion: s.pricingVersion + 1 })),
  reset: () => set({ step: 1, isPricingLoading: false, pricingVersion: 0 }),
}));
