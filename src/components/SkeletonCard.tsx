

export function SkeletonCard() {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden h-full">
            {/* Header */}
            <div className="h-24 bg-slate-800/50 animate-pulse relative">
                <div className="absolute top-4 right-4 w-20 h-8 bg-slate-700/50 rounded-lg" />
            </div>

            <div className="px-6 pb-6 pt-0">
                {/* Avatar area */}
                <div className="relative -mt-12 mb-4 flex justify-between items-end">
                    <div className="w-24 h-24 rounded-2xl bg-slate-800 border-4 border-slate-900 animate-pulse" />
                    <div className="flex gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
                        <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
                    </div>
                </div>

                {/* Name & Badge */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-16 h-5 rounded bg-slate-800/50 animate-pulse" />
                        <div className="w-40 h-6 rounded bg-slate-800 animate-pulse" />
                    </div>
                </div>

                {/* Metrics */}
                <div className="flex gap-4 mb-4">
                    <div className="w-16 h-4 rounded bg-slate-800 animate-pulse" />
                    <div className="w-16 h-4 rounded bg-slate-800 animate-pulse" />
                    <div className="w-16 h-4 rounded bg-slate-800 animate-pulse" />
                </div>

                {/* Description */}
                <div className="space-y-2 mb-6">
                    <div className="w-full h-4 rounded bg-slate-800 animate-pulse" />
                    <div className="w-2/3 h-4 rounded bg-slate-800 animate-pulse" />
                </div>

                {/* Tech Stack */}
                <div className="flex gap-2 mb-6">
                    <div className="w-12 h-6 rounded bg-slate-800 animate-pulse" />
                    <div className="w-16 h-6 rounded bg-slate-800 animate-pulse" />
                    <div className="w-10 h-6 rounded bg-slate-800 animate-pulse" />
                    <div className="w-14 h-6 rounded bg-slate-800 animate-pulse" />
                </div>

                {/* Bottom Bar */}
                <div className="mt-auto pt-6 border-t border-slate-800/50 grid grid-cols-2 gap-4">
                    <div className="h-2 w-full bg-slate-800 rounded-full animate-pulse" />
                    <div className="h-2 w-full bg-slate-800 rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    );
}
