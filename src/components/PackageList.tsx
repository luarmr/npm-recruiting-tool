import { useState, useEffect } from 'react';
import type { CandidateResult } from '../types';
import { DeveloperCard } from './DeveloperCard';
import { DeveloperRow } from './DeveloperRow';
import { supabase } from '../lib/supabase';
import type { ColumnId } from '../hooks/useColumnPreferences';

interface PackageListProps {
    results: CandidateResult[];
    title?: string;
    viewMode: 'grid' | 'list';
    onStatusChange?: (id: number, newStatus: string) => void;
    visibleColumns?: Set<ColumnId>;
}

export function PackageList({ results, title, viewMode, onStatusChange, visibleColumns = new Set() }: PackageListProps) {
    const [savedPackageNames, setSavedPackageNames] = useState<Set<string>>(new Set());
    const [teamId, setTeamId] = useState<string | null>(null);

    useEffect(() => {
        fetchUserData();
    }, [results]);

    const fetchUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setSavedPackageNames(new Set());
            return;
        }

        // 1. Get User's Team
        const { data: teamData } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .single();

        if (teamData) setTeamId(teamData.team_id);

        // 2. Get Saved Status (Own + Team)
        const packageNames = results.map(r => r.package.name);
        if (packageNames.length === 0) return;

        // We rely on RLS to return both own and team saves
        const { data } = await supabase
            .from('saved_candidates')
            .select('package_name')
            .in('package_name', packageNames);

        if (data) {
            setSavedPackageNames(new Set(data.map(item => item.package_name)));
        }
    };

    const handleToggleSave = (packageName: string, isSaved: boolean) => {
        const newSet = new Set(savedPackageNames);
        if (isSaved) {
            newSet.add(packageName);
        } else {
            newSet.delete(packageName);
        }
        setSavedPackageNames(newSet);
    };

    if (results.length === 0) {
        return null;
    }

    return (
        <div className="mb-12">
            {title && (
                <div className="flex items-center mb-6 justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        {title}
                        <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                            {results.length}
                        </span>
                    </h2>
                </div>
            )}

            {viewMode === 'grid' ? (
                <div className="flex flex-wrap justify-center gap-6">
                    {results.map((result, index) => (
                        <div
                            key={`${result.package.name}-${index}`}
                            className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-md"
                        >
                            <DeveloperCard
                                result={result}
                                index={index}
                                initialIsSaved={savedPackageNames.has(result.package.name)}
                                onToggleSave={handleToggleSave}
                                teamId={teamId}
                                onStatusChange={onStatusChange}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="min-w-full w-fit rounded-xl border border-slate-800 bg-slate-900/50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
                                <th className="py-4 pl-4 font-medium">Candidate</th>
                                {visibleColumns.has('username') && <th className="py-4 px-4 font-medium">Username</th>}
                                {visibleColumns.has('bio') && <th className="py-4 px-4 font-medium">Bio</th>}
                                {visibleColumns.has('tech_stack') && <th className="py-4 px-4 font-medium">Tech Stack</th>}
                                {visibleColumns.has('impact') && <th className="py-4 px-4 font-medium">Impact</th>}
                                {visibleColumns.has('repos') && <th className="py-4 px-4 font-medium text-center">Repos</th>}
                                {visibleColumns.has('followers') && <th className="py-4 px-4 font-medium text-center">Followers</th>}
                                {visibleColumns.has('following') && <th className="py-4 px-4 font-medium text-center">Following</th>}
                                {visibleColumns.has('location') && <th className="py-4 px-4 font-medium">Location</th>}
                                {visibleColumns.has('contributions') && <th className="py-4 pr-4 font-medium w-64">Contributions (Last Year)</th>}
                                {visibleColumns.has('status') && onStatusChange && <th className="py-4 px-4 font-medium">Status</th>}
                                <th className="py-4 pr-4 font-medium w-16 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {results.map((result, index) => (
                                <DeveloperRow
                                    key={`${result.package.name}-${index}`}
                                    result={result}
                                    index={index}
                                    initialIsSaved={savedPackageNames.has(result.package.name)}
                                    onToggleSave={handleToggleSave}
                                    teamId={teamId}
                                    visibleColumns={visibleColumns}
                                    onStatusChange={onStatusChange}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
