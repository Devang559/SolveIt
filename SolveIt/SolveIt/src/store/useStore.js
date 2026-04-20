import { create } from 'zustand';

export const useStore = create((set) => ({
    paths: [],
    redoStack: [],
    currentPath: "",
    
    // Actions
    setCurrentPath: (path) => set({ currentPath: path }),
    
    addPath: (path) => set((state) => ({
        paths: [...state.paths, path],
        redoStack: [],
        // We removed currentPath reset from here to prevent sync issues
    })),
    
    undo: () => set((state) => {
        if (state.paths.length === 0) return state;
        const lastPath = state.paths[state.paths.length - 1];
        return {
            redoStack: [...state.redoStack, lastPath],
            paths: state.paths.slice(0, -1)
        };
    }),
    
    redo: () => set((state) => {
        if (state.redoStack.length === 0) return state;
        const nextPath = state.redoStack[state.redoStack.length - 1];
        return {
            paths: [...state.paths, nextPath],
            redoStack: state.redoStack.slice(0, -1)
        };
    }),
    
    reset: () => set({ paths: [], redoStack: [], currentPath: "" })
}));