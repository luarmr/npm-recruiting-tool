import { useState, useEffect } from 'react';
import type { NpmSearchResult } from '../types';
import { ExternalLink, Github, Trophy, TrendingUp, ShieldCheck, Code2, Heart, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDeveloperProfile } from '../hooks/useDeveloperProfile';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface DeveloperCardProps {
    result: NpmSearchResult;
    index: number;
    initialIsSaved: boolean;
    onToggleSave: (packageName: string, isSaved: boolean) => void;
    teamId: string | null;
    onStatusChange?: (id: number, newStatus: string) => void;
}

export function DeveloperCard({ result, index, initialIsSaved, onToggleSave, teamId, onStatusChange }: DeveloperCardProps) {
    const { package: pkg, score } = result;
    const {
        githubUsername,
        avatarUrl,
        githubProfileUrl,
        impactLevel,
        impactColor,
        showTopTalent,
        hasVerifiedGithub,
        setAvatarError,
        graphError,
        setGraphError
    } = useDeveloperProfile(result);

    const statusColors: Record<string, string> = {
        new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        replied: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        interviewing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        hired: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setIsSaved(initialIsSaved);
    }, [initialIsSaved]);

    const toggleSave = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
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

                onToggleSave(pkg.name, false);
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
                onToggleSave(pkg.name, true);
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const CardContent = () => (
        <>
            {/* Header Background */}
            <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:16px_16px]" />
                <div className="absolute top-0 right-0 p-4 flex gap-2">
                    {showTopTalent && (
                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                            <Trophy className="w-3 h-3" />
                            <span>Top Talent</span>
                        </div>
                    )}
                    <button
                        onClick={toggleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all z-10 ${isSaved
                            ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        {isSaved ? 'Saved' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="px-6 pb-6 flex-grow flex flex-col">
                {/* Avatar & Name */}
                <div className="relative -mt-12 mb-4 flex justify-between items-end">
                    <div className="w-24 h-24 rounded-2xl border-4 border-slate-900 bg-slate-800 overflow-hidden shadow-lg">
                        <img
                            src={avatarUrl}
                            alt={pkg.publisher?.username}
                            className="w-full h-full object-cover"
                            onError={() => setAvatarError(true)}
                        />
                    </div>
                    <div className="flex gap-2 mb-1">
                        {githubProfileUrl && (
                            <a
                                href={githubProfileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700/50 z-10"
                                title="GitHub Profile"
                            >
                                <Github className="w-4 h-4" />
                            </a>
                        )}
                        {pkg.links.homepage && (
                            <a
                                href={pkg.links.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700/50 z-10"
                                title="Portfolio / Homepage"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">
                        {pkg.publisher?.username || pkg.author?.name || 'Unknown Developer'}
                    </h3>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        {result.status && onStatusChange && result.id ? (
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
                            <div className="text-xs text-slate-500">
                                {result.package.date ? new Date(result.package.date).toLocaleDateString() : 'No date'}
                            </div>
                        )}
                    </div>

                    <div className={`text-sm font-medium ${impactColor} flex items-center gap-2 mb-2`}>
                        {impactLevel}
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1" title="Followers">
                            <span className="font-semibold text-slate-200">{result.githubUser?.followers ?? '-'}</span> Followers
                        </div>
                        <div className="flex items-center gap-1" title="Following">
                            <span className="font-semibold text-slate-200">{result.githubUser?.following ?? '-'}</span> Following
                        </div>
                        <div className="flex items-center gap-1" title="Public Repositories">
                            <span className="font-semibold text-slate-200">{result.githubUser?.public_repos ?? '-'}</span> Repos
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm line-clamp-2">
                        Maintainer of <span className="text-slate-200 font-medium">{pkg.name}</span>. {pkg.description}
                    </p>
                </div>

                {/* Skills / Tech Stack */}
                <div className="mb-6">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Code2 className="w-3 h-3" /> Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {pkg.keywords?.slice(0, 5).map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50 font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* GitHub Contribution Graph */}
                {githubUsername && !graphError && hasVerifiedGithub && (
                    <div className="mb-6">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> Contribution Activity
                        </h4>
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30 overflow-hidden">
                            <img
                                src={`https://ghchart.rshah.org/4f46e5/${githubUsername}`}
                                alt="Contribution Graph"
                                className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                                onError={() => setGraphError(true)}
                            />
                        </div>
                    </div>
                )}

                {/* Saved By Badge */}
                {result.savedBy && (
                    <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/30 p-2 rounded-lg border border-slate-800/50">
                        <Users className="w-3 h-3" />
                        <span>Saved by <span className="text-slate-300">{result.savedBy}</span></span>
                    </div>
                )}

                {/* Status Badge */}
                {result.status && (
                    <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/30 p-2 rounded-lg border border-slate-800/50">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="uppercase tracking-wider font-bold text-indigo-400">{result.status}</span>
                    </div>
                )}

                {/* Impact Metrics */}
                <div className="mt-auto pt-6 border-t border-slate-800/50 grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Popularity
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${score.detail.popularity * 100}%` }}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Code Quality
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${score.detail.quality * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const navigate = useNavigate();

    const handleCardClick = () => {
        if (result.id) {
            navigate(`/candidate/${result.id}`);
        }
    };

    const containerClasses = `group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-full text-left ${result.id ? 'cursor-pointer' : ''}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={containerClasses}
            onClick={handleCardClick}
            role={result.id ? "button" : undefined}
            tabIndex={result.id ? 0 : undefined}
            onKeyDown={(e) => {
                if (result.id && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleCardClick();
                }
            }}
        >
            <CardContent />
        </motion.div>
    );
}
