import { Label } from "../types";
import { X } from "lucide-react";

interface LabelBadgeProps {
    label: Label;
    onRemove?: () => void;
    size?: "sm" | "md";
}

export function LabelBadge({ label, onRemove, size = "md" }: LabelBadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-medium ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
                }`}
            style={{
                backgroundColor: `${label.color}20`, // 12% opacity
                color: label.color,
                borderColor: `${label.color}40`,
                borderWidth: "1px",
            }}
        >
            {label.name}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="hover:bg-black/10 rounded-full p-0.5 ml-0.5 transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
}
