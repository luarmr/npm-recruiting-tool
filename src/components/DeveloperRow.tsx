import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { CandidateResult } from '../types';
import { useDeveloperProfile } from '../hooks/useDeveloperProfile';
import type { ColumnId } from '../hooks/useColumnPreferences';

interface DeveloperRowProps {
    result: CandidateResult;
    index: number;
    initialIsSaved?: boolean;
    onToggleSave?: (packageName: string, isSaved: boolean) => void;
    teamId?: string | null;
    visibleColumns: Set<ColumnId>;
    onStatusChange?: (id: number, newStatus: string) => void;
}

export function DeveloperRow({ result, index, initialIsSaved = false, onToggleSave, teamId, visibleColumns, onStatusChange }: DeveloperRowProps) {
    const { package: pkg, score } = result;
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const handleRowClick = () => {
        if (result.id) {
            navigate(`/candidate/${result.id}`);
        }
    };

    useEffect(() => {
        setIsSaved(initialIsSaved);
    }, [initialIsSaved]);

    const toggleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Please sign in to save candidates');
            return;
        }

        setIsSaving(true);
        try {
            if (isSaved) {
                await supabase
                    .from('saved_candidates')
                    .delete()
                    .eq('package_name', pkg.name);

                onToggleSave?.(pkg.name, false);
            } else {
                await supabase
                    .from('saved_candidates')
                    .insert({
                        user_id: user.id,
                        team_id: teamId,
                        package_name: pkg.name,
                        package_version: pkg.version,
                        description: pkg.description,
                        keywords: pkg.keywords,
                        date: pkg.date,
                        npm_link: pkg.links.npm,
                        repository_link: pkg.links.repository,
                        homepage_link: pkg.links.homepage,
                        publisher_username: pkg.publisher?.username,
                        publisher_email: pkg.publisher?.email,
                        score_final: score.final,
                        score_quality: score.detail.quality,
                        score_popularity: score.detail.popularity,
                        score_maintenance: score.detail.maintenance,
                        github_user_data: result.githubUser
                    });
                onToggleSave?.(pkg.name, true);
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const {
        githubProfileUrl,
        githubUsername,
        hasVerifiedGithub,
        graphError,
        setGraphError
    } = useDeveloperProfile(result);

    const userData = result.githubUser; // Alias for brevity

    const statusColors: Record<string, string> = {
        new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        replied: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        interviewing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        hired: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors align-middle"
        >
            <td className="py-4 pl-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        onClick={handleRowClick}
                        className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-indigo-400 font-bold text-lg flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                    >
                        {result.githubUser?.avatar_url ? (
                            <img src={result.githubUser.avatar_url} alt={result.package.publisher?.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            (result.package.publisher?.username || '?').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="min-w-0">
                        <div
                            onClick={handleRowClick}
                            className="font-medium text-white truncate cursor-pointer hover:text-indigo-400 transition-colors"
                        >
                            {result.package.publisher?.username || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            {result.source === 'pypi' ? (
                                <span className="text-yellow-500 flex items-center gap-1">
                                    <img src="https://pypi.org/static/images/logo-small.2a411bc6.svg" className="w-3 h-3" alt="PyPI" />
                                    PyPI
                                </span>
                            ) : result.source === 'github' ? (
                                <span className="text-slate-400 flex items-center gap-1">
                                    <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                    GitHub
                                </span>
                            ) : (
                                <span className="text-red-500 flex items-center gap-1">
                                    <svg viewBox="0 0 780 250" className="w-3 h-3 fill-current"><path d="M240,250h100v-50h100V0H240V250z M340,50h50v100h-50V50z M480,0v200h100V50h50v150h50V50h50v150h50V0H480z M0,200h100V50h50v150h50V0H0V200z"></path></svg>
                                    NPM
                                </span>
                            )}

                        </div>
                    </div>
                </div>
            </td>

            {/* Username */}
            {visibleColumns.has('username') && (
                <td className="py-4 px-4">
                    <a
                        href={githubProfileUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        @{githubUsername || pkg.publisher?.username}
                    </a>
                </td>
            )}

            {/* Bio */}
            {visibleColumns.has('bio') && (
                <td className="py-4 px-4 max-w-xs">
                    <div className="text-sm text-slate-400 truncate" title={result.githubUser?.bio || pkg.description}>
                        {result.githubUser?.bio || pkg.description}
                    </div>
                </td>
            )}

            {/* Tech Stack */}
            {visibleColumns.has('tech_stack') && (
                <td className="py-4 px-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                        {pkg.keywords?.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50 whitespace-nowrap">
                                {tag}
                            </span>
                        ))}
                        {(pkg.keywords?.length || 0) > 3 && (
                            <span className="text-[10px] text-slate-500 px-1">+{pkg.keywords!.length - 3}</span>
                        )}
                    </div>
                </td>
            )}

            {/* Impact Level */}
            {visibleColumns.has('impact') && (
                <td className="py-4 px-4 whitespace-nowrap">
                    <div className={`text-xs font-medium ${useDeveloperProfile(result).impactColor}`}>
                        {useDeveloperProfile(result).impactLevel}
                    </div>
                </td>
            )}

            {/* Repos */}
            {visibleColumns.has('repos') && (
                <td className="py-4 px-4 text-center">
                    <span className="text-sm text-slate-300 font-mono">
                        {userData?.public_repos ?? '-'}
                    </span>
                </td>
            )}

            {/* Followers */}
            {visibleColumns.has('followers') && (
                <td className="py-4 px-4 text-center">
                    <span className="text-sm text-slate-300 font-mono">
                        {userData?.followers ?? '-'}
                    </span>
                </td>
            )}

            {/* Following */}
            {visibleColumns.has('following') && (
                <td className="py-4 px-4 text-center">
                    <span className="text-sm text-slate-300 font-mono">
                        {userData?.following ?? '-'}
                    </span>
                </td>
            )}

            {/* Location */}
            {visibleColumns.has('location') && (
                <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-400 whitespace-nowrap">
                        {userData?.location ? (
                            <>
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[150px]">{userData.location}</span>
                            </>
                        ) : (
                            <span className="text-slate-600 italic">N/A</span>
                        )}
                    </div>
                </td>
            )}

            {/* Contributions Graph */}
            {visibleColumns.has('contributions') && (
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
            )}

            {/* Status */}
            {visibleColumns.has('status') && onStatusChange && (
                <td className="py-4 px-4">
                    {result.status && result.id ? (
                        <select
                            value={result.status}
                            onChange={(e) => onStatusChange(result.id!, e.target.value)}
                            className={`text-xs font-medium px-2 py-1 rounded-lg border outline-none cursor-pointer ${statusColors[result.status]}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="replied">Replied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    ) : (
                        <span className="text-xs text-slate-600">-</span>
                    )}
                </td>
            )}

            {/* Save Button */}
            <td className="py-4 pr-4 text-right">
                <button
                    onClick={toggleSave}
                    disabled={isSaving}
                    className={`p-2 rounded-lg transition-all ${isSaved
                        ? 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    title={isSaved ? "Unsave" : "Save"}
                >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>
            </td>
        </motion.tr>
    );
}
