import { useState, useEffect } from 'react';

export type ColumnId =
    | 'username'
    | 'bio'
    | 'tech_stack'
    | 'impact'
    | 'repos'
    | 'followers'
    | 'following'
    | 'location'
    | 'contributions'
    | 'status';

export const AVAILABLE_COLUMNS: { id: ColumnId; label: string }[] = [
    { id: 'username', label: 'Username' },
    { id: 'bio', label: 'Bio' },
    { id: 'tech_stack', label: 'Tech Stack' },
    { id: 'impact', label: 'Impact' },
    { id: 'repos', label: 'Repos' },
    { id: 'followers', label: 'Followers' },
    { id: 'following', label: 'Following' },
    { id: 'location', label: 'Location' },
    { id: 'contributions', label: 'Contributions' },
    { id: 'status', label: 'Status' },
];

const DEFAULT_COLUMNS: ColumnId[] = [
    'username',
    'bio',
    'tech_stack',
    'impact',
    'repos',
    'followers',
    'location',
    'contributions',
    'status'
];

export function useColumnPreferences() {
    const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
        const saved = localStorage.getItem('npm_search_columns_v2');
        if (saved) {
            try {
                return new Set(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved columns', e);
            }
        }
        return new Set(DEFAULT_COLUMNS);
    });

    useEffect(() => {
        localStorage.setItem('npm_search_columns_v2', JSON.stringify(Array.from(visibleColumns)));
    }, [visibleColumns]);

    const toggleColumn = (columnId: ColumnId) => {
        const newSet = new Set(visibleColumns);
        if (newSet.has(columnId)) {
            newSet.delete(columnId);
        } else {
            newSet.add(columnId);
        }
        setVisibleColumns(newSet);
    };

    return {
        visibleColumns,
        toggleColumn,
        availableColumns: AVAILABLE_COLUMNS
    };
}
