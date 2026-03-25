import { create } from "zustand";

interface BookSearchState {
  // Search form
  tripType: "one-way" | "round-trip";
  originCode: string;
  destinationCode: string;
  departureDate: string;
  passengerCount: number;
  vehicleCount: number;

  // Execution state
  hasSearched: boolean;
  selectedTripIds: string[];

  // Round-trip
  returnDate: string;
  hasSearchedReturn: boolean;
  selectedReturnTripIds: string[];

  // Actions
  setTripType: (type: "one-way" | "round-trip") => void;
  setOriginCode: (code: string) => void;
  setDestinationCode: (code: string) => void;
  setDepartureDate: (date: string) => void;
  setReturnDate: (date: string) => void;
  incrementPassengers: () => void;
  decrementPassengers: () => void;
  incrementVehicles: () => void;
  decrementVehicles: () => void;
  search: () => void;
  selectTrip: (tripId: string) => void;
  selectReturnTrip: (tripId: string) => void;
  handleDateSelect: (date: string) => void;
  handleReturnDateSelect: (date: string) => void;
  reset: () => void;
}

const RETURN_RESET = {
  returnDate: "",
  hasSearchedReturn: false,
  selectedReturnTripIds: [] as string[],
};

const initialState = {
  tripType: "one-way" as const,
  originCode: "",
  destinationCode: "",
  departureDate: new Date().toISOString().split("T")[0],
  passengerCount: 1,
  vehicleCount: 0,
  hasSearched: false,
  selectedTripIds: [] as string[],
  ...RETURN_RESET,
};

export const useBookSearchStore = create<BookSearchState>()((set, get) => ({
  ...initialState,

  setTripType: (tripType) =>
    set(tripType === "one-way" ? { tripType, ...RETURN_RESET } : { tripType }),

  setOriginCode: (originCode) =>
    set((s) => ({
      originCode,
      destinationCode: "",
      ...(s.hasSearched ? { hasSearched: false, selectedTripIds: [] } : {}),
      ...RETURN_RESET,
    })),

  setDestinationCode: (destinationCode) =>
    set({ destinationCode, ...RETURN_RESET }),

  setDepartureDate: (departureDate) =>
    set((s) => ({
      departureDate,
      ...(s.returnDate && s.returnDate < departureDate ? RETURN_RESET : {}),
    })),

  setReturnDate: (returnDate) => set({ returnDate }),

  incrementPassengers: () =>
    set((s) => ({ passengerCount: s.passengerCount + 1 })),

  decrementPassengers: () =>
    set((s) => ({ passengerCount: Math.max(1, s.passengerCount - 1) })),

  incrementVehicles: () =>
    set((s) => ({ vehicleCount: s.vehicleCount + 1 })),

  decrementVehicles: () =>
    set((s) => ({ vehicleCount: Math.max(0, s.vehicleCount - 1) })),

  search: () => {
    const s = get();
    if (!s.originCode || !s.destinationCode || !s.departureDate) return;
    set({
      hasSearched: true,
      selectedTripIds: [],
      ...(s.tripType === "round-trip" && s.returnDate
        ? { hasSearchedReturn: true, selectedReturnTripIds: [] }
        : {}),
    });
  },

  selectTrip: (tripId) =>
    set((s) => ({
      selectedTripIds: s.selectedTripIds.includes(tripId)
        ? s.selectedTripIds.filter((id) => id !== tripId)
        : [...s.selectedTripIds, tripId],
    })),

  selectReturnTrip: (tripId) =>
    set((s) => ({
      selectedReturnTripIds: s.selectedReturnTripIds.includes(tripId)
        ? s.selectedReturnTripIds.filter((id) => id !== tripId)
        : [...s.selectedReturnTripIds, tripId],
    })),

  handleDateSelect: (date) =>
    set({ departureDate: date, hasSearched: true, selectedTripIds: [] }),

  handleReturnDateSelect: (date) =>
    set({
      returnDate: date,
      hasSearchedReturn: true,
      selectedReturnTripIds: [],
    }),

  reset: () => set(initialState),
}));

// Selectors for atomic subscriptions
export const selectIsRoundTrip = (s: BookSearchState) =>
  s.tripType === "round-trip";

export const selectCanContinue = (s: BookSearchState) =>
  s.selectedTripIds.length > 0 &&
  (s.tripType !== "round-trip" || s.selectedReturnTripIds.length > 0);
