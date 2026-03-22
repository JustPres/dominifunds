import { create } from "zustand";

type ViewRole = "OFFICER" | "STUDENT";

interface RoleState {
  viewAs: ViewRole;
  setViewAs: (role: ViewRole) => void;
}

export const useRoleStore = create<RoleState>((set) => ({
  viewAs: "OFFICER",
  setViewAs: (role) => set({ viewAs: role }),
}));
