import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trophy, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { NpmSearchResult } from '../types';
import { useDeveloperProfile } from '../hooks/useDeveloperProfile';

interface DeveloperRowProps {
    result: NpmSearchResult;
    index: number;
    initialIsSaved: boolean;
    onToggleSave: (packageName: string, isSaved: boolean) => void;
    teamId: string | null;
}

export function DeveloperRow({ result, index, initialIsSaved, onToggleSave, teamId }: DeveloperRowProps) {
    const { package: pkg, score } = result;
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [isSaving, setIsSaving] = useState(false);

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

            {/* Tech Stack */}
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

            {/* Impact Level */}
            <td className="py-4 px-4 whitespace-nowrap">
                <div className={`text-xs font-medium ${useDeveloperProfile(result).impactColor}`}>
                    {useDeveloperProfile(result).impactLevel}
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

            {/* Following */}
            <td className="py-4 px-4 text-center">
                <span className="text-sm text-slate-300 font-mono">
                    {result.githubUser?.following ?? '-'}
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
