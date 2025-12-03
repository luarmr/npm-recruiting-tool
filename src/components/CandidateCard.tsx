import type { NpmSearchResult } from '../types';
import { ExternalLink, Calendar, Box, User, Star, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface CandidateCardProps {
    result: NpmSearchResult;
    index: number;
}

export function CandidateCard({ result, index }: CandidateCardProps) {
    const { package: pkg, score } = result;

    // Format date
    const date = new Date(pkg.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 backdrop-blur-sm flex flex-col h-full"
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate max-w-[200px]" title={pkg.name}>
                        {pkg.name}
                    </h3>
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono text-slate-400 mr-2">v{pkg.version}</span>
                        <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {date}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <a
                        href={pkg.links.npm}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="View on NPM"
                    >
                        <Box className="w-4 h-4" />
                    </a>
                    {pkg.links.homepage && (
                        <a
                            href={pkg.links.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                            title="Homepage"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>

            <p className="text-slate-400 text-sm mb-6 line-clamp-3 flex-grow">
                {pkg.description}
            </p>

            <div className="mt-auto">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {pkg.publisher?.username.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-200">
                                {pkg.publisher?.username || pkg.author?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-slate-500">Publisher</span>
                        </div>
                    </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-800/50">
                    <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                            <Star className="w-3 h-3" /> Quality
                        </div>
                        <div className="text-sm font-bold text-emerald-400">
                            {Math.round(score.detail.quality * 100)}%
                        </div>
                    </div>
                    <div className="text-center border-l border-slate-800/50">
                        <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                            <Activity className="w-3 h-3" /> Popularity
                        </div>
                        <div className="text-sm font-bold text-blue-400">
                            {Math.round(score.detail.popularity * 100)}%
                        </div>
                    </div>
                    <div className="text-center border-l border-slate-800/50">
                        <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1">
                            <Box className="w-3 h-3" /> Maint.
                        </div>
                        <div className="text-sm font-bold text-purple-400">
                            {Math.round(score.detail.maintenance * 100)}%
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
