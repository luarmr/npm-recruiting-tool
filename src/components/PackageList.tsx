import { useState, useEffect } from 'react';
import type { CandidateResult, Label } from '../types';
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
    onLabelUpdate?: (candidateId: number, newLabels: Label[]) => void;
    // Optional callbacks if parent wants to control save/remove (like in SavedCandidates)
    onSave?: (candidate: CandidateResult) => void;
    onRemove?: (candidate: CandidateResult) => void;
}

export function PackageList({
    results,
    title,
    viewMode,
    onStatusChange,
    visibleColumns = new Set(),
    onLabelUpdate,
    onSave,
    onRemove
}: PackageListProps) {
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
        // Only relevant if we are in search mode (no IDs yet or checked against DB)
        // If we are in SavedCandidates, results already have IDs.
        const packageNames = results.map(r => r.package.name);
        if (packageNames.length === 0) return;

        const { data } = await supabase
            .from('saved_candidates')
            .select('package_name')
            .in('package_name', packageNames);

        if (data) {
            setSavedPackageNames(new Set(data.map(item => item.package_name)));
        }
    };

    const internalOnSave = (candidate: CandidateResult) => {
        setSavedPackageNames(prev => new Set(prev).add(candidate.package.name));
        onSave?.(candidate);
    }

    const internalOnRemove = (candidate: CandidateResult) => { // Expect candidate object now
        // For remove, we might get an ID if it's saved, or just the candidate object
        // The new DeveloperCard calls onRemove(id) or onRemove(candidate) depending...
        // Actually DeveloperCard calls onRemove(id) if ID exists.
        // But DeveloperRow calls onRemove(candidate).
        // I should standardize.
        // Let's stick to what DeveloperRow/Card expects.
        // DeveloperCard expects onRemove?: (id: number) => void;
        // DeveloperRow expects onRemove?: (candidate: CandidateResult) => void;
        // This is inconsistent. I should fix the components first or adapt here.

        // Looking at my previous write_to_file for DeveloperCard:
        // onRemove?: (id: number) => void;
        // And DeveloperRow:
        // onRemove?: (candidate: CandidateResult) => void;

        // I will adapt here.
        setSavedPackageNames(prev => {
            const next = new Set(prev);
            next.delete(candidate.package.name);
            return next;
        });
        onRemove?.(candidate);
    }

    // Adapt for DeveloperCard which sends ID
    const handleCardRemove = (id: number) => {
        // Find candidate by ID to remove from local Set
        const candidate = results.find(r => r.id === id);
        if (candidate) {
            internalOnRemove(candidate);
        }
    }

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
                                candidate={result}
                                index={index}
                                isSaved={savedPackageNames.has(result.package.name)}
                                onSave={internalOnSave}
                                onRemove={handleCardRemove}
                                teamId={teamId}
                                onStatusChange={onStatusChange}
                                onLabelUpdate={onLabelUpdate}
                                onNotesClick={() => { }} // Placeholder
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
                                {visibleColumns.has('labels') && <th className="py-4 px-4 font-medium">Labels</th>}
                                <th className="py-4 pr-4 font-medium w-16 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {results.map((result, index) => (
                                <DeveloperRow
                                    key={`${result.package.name}-${index}`}
                                    candidate={result}
                                    index={index}
                                    isSaved={savedPackageNames.has(result.package.name)}
                                    // DeveloperRow expects onSave: (candidate) => void
                                    onSave={internalOnSave}
                                    // DeveloperRow expects onRemove: (candidate) => void
                                    onRemove={internalOnRemove}
                                    teamId={teamId}
                                    visibleColumns={visibleColumns}
                                    onStatusChange={onStatusChange}
                                    onLabelUpdate={onLabelUpdate}
                                    onNotesClick={() => { }} // Placeholder
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
