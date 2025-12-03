import { motion } from 'framer-motion';
import { MapPin, Trophy } from 'lucide-react';
import type { NpmSearchResult } from '../types';
import { useDeveloperProfile } from '../hooks/useDeveloperProfile';

interface DeveloperRowProps {
    result: NpmSearchResult;
    index: number;
}

export function DeveloperRow({ result, index }: DeveloperRowProps) {
    const { package: pkg } = result;
    const {
        avatarUrl,
        githubProfileUrl,
        githubUsername,
        setAvatarError,
        hasVerifiedGithub,
        graphError,
        setGraphError
    } = useDeveloperProfile(result);

    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors align-middle"
        >
            {/* Avatar */}
            <td className="py-4 pl-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <img
                        src={avatarUrl}
                        alt={pkg.publisher?.username}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                    />
                </div>
            </td>

            {/* Name */}
            <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200 whitespace-nowrap">
                        {pkg.author?.name || pkg.publisher?.username || 'Unknown'}
                    </span>
                    {result.searchScore > 100 && (
                        <Trophy className="w-3 h-3 text-emerald-400" />
                    )}
                </div>
            </td>

            {/* Username */}
            <td className="py-4 px-4">
                <a
                    href={githubProfileUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline"
                >
                    @{githubUsername || pkg.publisher?.username}
                </a>
            </td>

            {/* Bio */}
            <td className="py-4 px-4 max-w-xs">
                <div className="text-sm text-slate-400 truncate" title={result.githubUser?.bio || pkg.description}>
                    {result.githubUser?.bio || pkg.description}
                </div>
            </td>

            {/* Repos */}
            <td className="py-4 px-4 text-center">
                <span className="text-sm text-slate-300 font-mono">
                    {result.githubUser?.public_repos ?? '-'}
                </span>
            </td>

            {/* Followers */}
            <td className="py-4 px-4 text-center">
                <span className="text-sm text-slate-300 font-mono">
                    {result.githubUser?.followers ?? '-'}
                </span>
            </td>

            {/* Location */}
            <td className="py-4 px-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-400 whitespace-nowrap">
                    {result.githubUser?.location ? (
                        <>
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{result.githubUser.location}</span>
                        </>
                    ) : (
                        <span className="text-slate-600 italic">N/A</span>
                    )}
                </div>
            </td>

            {/* Contributions Graph */}
            <td className="py-4 pr-4 w-64">
                {githubUsername && !graphError && hasVerifiedGithub ? (
                    <div className="h-8 overflow-hidden opacity-70 group-hover:opacity-100 transition-opacity">
                        <img
                            src={`https://ghchart.rshah.org/10b981/${githubUsername}`}
                            alt="Contributions"
                            className="w-full h-full object-cover object-right"
                            onError={() => setGraphError(true)}
                        />
                    </div>
                ) : (
                    <div className="h-8 w-full bg-slate-800/30 rounded flex items-center justify-center text-xs text-slate-600">
                        No data
                    </div>
                )}
            </td>
        </motion.tr>
    );
}
