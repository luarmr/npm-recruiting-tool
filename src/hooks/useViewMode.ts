import { useState, useEffect } from 'react';

type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'npm_candidate_search_view_mode';

export function useViewMode() {
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return (saved === 'grid' || saved === 'list') ? saved : 'grid';
        } catch {
            return 'grid';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, viewMode);
        } catch (e) {
            console.warn('Failed to save view mode to localStorage', e);
        }
    }, [viewMode]);

    return { viewMode, setViewMode };
}
