import { create } from "zustand";

interface UIState {
    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    activeDragTask: string | null;
    setActiveDragTask: (id: string | null) => void;
    viewMode: "kanban" | "table";
    setViewMode: (mode: "kanban" | "table") => void;
}

export const useUIStore = create<UIState>((set) => ({
    activeProjectId: null,
    setActiveProjectId: (id) => set({ activeProjectId: id }),
    isModalOpen: false,
    setIsModalOpen: (open) => set({ isModalOpen: open }),
    activeDragTask: null,
    setActiveDragTask: (id) => set({ activeDragTask: id }),
    viewMode: "kanban",
    setViewMode: (mode) => set({ viewMode: mode }),
}));