import { useState, useRef, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { type ColumnId, AVAILABLE_COLUMNS } from '../hooks/useColumnPreferences';

interface ColumnSelectorProps {
    visibleColumns: Set<ColumnId>;
    onToggleColumn: (id: ColumnId) => void;
}

export function ColumnSelector({ visibleColumns, onToggleColumn }: ColumnSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm font-medium"
                title="Customize Columns"
            >
                <Settings className="w-4 h-4" />
                Columns
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-800">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                            Toggle Columns
                        </span>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {AVAILABLE_COLUMNS.map((col) => (
                            <button
                                key={col.id}
                                onClick={() => onToggleColumn(col.id)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 text-left transition-colors group"
                            >
                                <span className={`text-sm ${visibleColumns.has(col.id) ? 'text-white' : 'text-slate-400'}`}>
                                    {col.label}
                                </span>
                                {visibleColumns.has(col.id) && (
                                    <Check className="w-4 h-4 text-indigo-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
