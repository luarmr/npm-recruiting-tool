import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
    onSearch: (query: string) => void;
    isLoading?: boolean;
}

export function SearchInput({ onSearch, isLoading }: SearchInputProps) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-12">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-30 group-hover:opacity-75 blur transition duration-500"></div>
                <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                    <Search className="ml-4 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search skills (e.g., 'react, typescript, redis')..."
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 py-4 px-4 text-lg"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mr-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Quick tags */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['react', 'vue', 'cli', 'database', 'animation', 'testing'].map((tag) => (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => {
                            setQuery(tag);
                            onSearch(tag);
                        }}
                        className="px-3 py-1 text-xs font-medium text-slate-400 bg-slate-800/50 hover:bg-slate-700/50 hover:text-white rounded-full border border-slate-700/50 transition-colors"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </form>
    );
}
