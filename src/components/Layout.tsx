import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col items-center">
            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl flex flex-col items-center w-full flex-grow">
                <header className="mb-16 flex flex-col items-center text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
                        <span className="text-xs font-semibold tracking-wide text-indigo-400 uppercase">Talent Intelligence Platform</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
                        Find World-Class <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Engineers</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        Source top-tier developer talent by analyzing open source contributions.
                        Identify experts in <span className="text-slate-200">React</span>, <span className="text-slate-200">Node.js</span>, <span className="text-slate-200">Rust</span>, and more.
                    </p>
                </header>

                <main className="w-full flex-grow">
                    {children}
                </main>

                <footer className="mt-32 py-12 border-t border-slate-800/50 text-center w-full">
                    <p className="text-slate-600 text-sm">
                        &copy; {new Date().getFullYear()} NPM Talent Search. Designed for Hiring Managers.
                    </p>
                </footer>
            </div>
        </div>
    );
}
