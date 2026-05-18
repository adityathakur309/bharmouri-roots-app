import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  role: "user" | "admin";
}

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  setSession: (user: AuthUser) => void;
  clearSession: () => void;
  updateProfile: (data: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      setSession: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      clearSession: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      updateProfile: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },
    }),
    {
      name: "bharmouriroots-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
