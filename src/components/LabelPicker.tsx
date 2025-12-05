import { useState, useRef, useEffect } from "react";
import { Plus, Check, Tag } from "lucide-react";
import { Label } from "../types";
import { useLabels } from "../hooks/useLabels";
import { useAuthUI } from "../context/AuthUIContext";

interface LabelPickerProps {
    currentLabels: Label[];
    onAssign: (label: Label) => void;
    onUnassign: (label: Label) => void;
    teamId?: string | null;
}

const COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#d946ef", // fuchsia
    "#ec4899", // pink
];

export function LabelPicker({
    currentLabels,
    onAssign,
    onUnassign,
    teamId,
}: LabelPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { labels, createLabel, refreshLabels } = useLabels(teamId);
    const { user } = useAuthUI();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Refresh labels when opening to ensure we have the latest
    useEffect(() => {
        if (isOpen) {
            refreshLabels();
        }
    }, [isOpen]);

    const filteredLabels = labels.filter((label) =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = async () => {
        if (!searchTerm.trim()) return;
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        try {
            const newLabel = await createLabel(searchTerm.trim(), color);
            if (newLabel) {
                onAssign(newLabel);
                setSearchTerm("");
            }
        } catch (e) {
            // Error handled in hook
        }
    };

    const toggleLabel = (label: Label) => {
        const isAssigned = currentLabels.some((l) => l.id === label.id);
        if (isAssigned) {
            onUnassign(label);
        } else {
            onAssign(label);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Add Label"
            >
                <Tag className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-slate-700">
                        <input
                            type="text"
                            placeholder="Search or create label..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-48 overflow-y-auto p-1">
                        {filteredLabels.map((label) => {
                            const isAssigned = currentLabels.some((l) => l.id === label.id);
                            return (
                                <button
                                    key={label.id}
                                    onClick={() => toggleLabel(label)}
                                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800 rounded-lg group transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: label.color }}
                                        />
                                        <span className="text-sm text-slate-200 group-hover:text-white">
                                            {label.name}
                                        </span>
                                    </div>
                                    {isAssigned && <Check className="w-3 h-3 text-indigo-400" />}
                                </button>
                            );
                        })}

                        {filteredLabels.length === 0 && searchTerm && (
                            <button
                                onClick={handleCreate}
                                className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-3 h-3" />
                                Create "{searchTerm}"
                            </button>
                        )}

                        {filteredLabels.length === 0 && !searchTerm && (
                            <div className="text-center p-4 text-xs text-slate-500">
                                No labels found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
