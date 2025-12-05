import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PackageList } from './PackageList';
import type { CandidateResult, Label } from '../types';
import { Loader2, Heart, Plus, X, Search, LayoutGrid, List, Tag } from 'lucide-react';
import { getGithubUser } from '../lib/github-api';
import { useViewMode } from '../hooks/useViewMode';
import { useColumnPreferences } from '../hooks/useColumnPreferences';
import { ColumnSelector } from './ColumnSelector';
import { Link } from 'react-router-dom';
import { useLabels } from '../hooks/useLabels';
import { SkeletonCard } from './SkeletonCard';
import { downloadCSV, downloadJSON } from '../utils/exportUtils';

export function SavedCandidates() {
    const [savedProfiles, setSavedProfiles] = useState<CandidateResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCandidateUsername, setNewCandidateUsername] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const { viewMode, setViewMode } = useViewMode();
    const { visibleColumns, toggleColumn } = useColumnPreferences();
    const [teamId, setTeamId] = useState<string | null>(null);
    const { labels: availableLabels } = useLabels(teamId);

    useEffect(() => {
        const init = async () => {
            // 1. Get User's Team
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: teamData } = await supabase
                    .from('team_members')
                    .select('team_id')
                    .eq('user_id', user.id)
                    .single();

                if (teamData) setTeamId(teamData.team_id);
            }
            fetchSavedCandidates();
        };
        init();
    }, []);

    const fetchSavedCandidates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch candidates with their labels joined
            const { data, error } = await supabase
                .from('saved_candidates')
                .select(`
                    *,
                    profiles(email),
                    saved_candidate_labels (
                        label: labels (*)
                    )
                `);

            if (error) throw error;

            // Transform DB data back to NpmSearchResult format
            const results: CandidateResult[] = data.map(item => ({
                id: item.id, // Populate ID
                package: {
                    name: item.package_name,
                    version: item.package_version,
                    description: item.description,
                    keywords: item.keywords || [],
                    date: item.date,
                    links: {
                        npm: item.npm_link,
                        repository: item.repository_link,
                        homepage: item.homepage_link
                    },
                    publisher: {
                        username: item.publisher_username,
                        email: item.publisher_email
                    }
                },
                score: {
                    final: item.score_final,
                    detail: {
                        quality: item.score_quality,
                        popularity: item.score_popularity,
                        maintenance: item.score_maintenance
                    }
                },
                searchScore: 0,
                githubUser: item.github_user_data,
                // @ts-ignore
                savedBy: item.profiles?.email,
                status: item.status || 'new',
                source: item.source || 'npm',
                // Map joined labels
                labels: item.saved_candidate_labels.map((scl: any) => scl.label),
                // Manual fields
                linkedinUrl: item.linkedin_url,
                twitterUsername: item.twitter_username,
                location: item.location,
                company: item.company
            }));

            setSavedProfiles(results);
        } catch (error) {
            console.error('Error fetching saved candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCandidateUsername.trim()) return;

        setAddLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please sign in to add candidates');
                return;
            }

            // 1. Fetch GitHub User
            const githubUser = await getGithubUser(newCandidateUsername);
            if (!githubUser) {
                alert('GitHub user not found');
                return;
            }

            // 2. Insert into DB
            const { error } = await supabase
                .from('saved_candidates')
                .insert({
                    user_id: user.id,
                    package_name: `github:${githubUser.login} `, // distinct from npm packages
                    package_version: '0.0.0',
                    description: githubUser.bio || 'Manual GitHub Entry',
                    keywords: ['github-profile'],
                    date: new Date().toISOString(),
                    npm_link: '',
                    repository_link: githubUser.html_url,
                    homepage_link: githubUser.blog || '',
                    publisher_username: githubUser.login,
                    publisher_email: githubUser.email || '',
                    score_final: 0,
                    score_quality: 0,
                    score_popularity: 0,
                    score_maintenance: 0,
                    github_user_data: githubUser,
                    status: 'new',
                    source: 'github'
                });

            if (error) throw error;

            // 3. Cleanup & Refresh
            setNewCandidateUsername('');
            setIsAddModalOpen(false);
            fetchSavedCandidates();

        } catch (error) {
            console.error('Error adding candidate:', error);
            alert('Failed to add candidate. They might already be in your list.');
        } finally {
            setAddLoading(false);
        }
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        // Optimistic update
        setSavedProfiles(prev => prev.map(p =>
            p.id === id ? { ...p, status: newStatus as any } : p
        ));

        try {
            const { error } = await supabase
                .from('saved_candidates')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert on error
            fetchSavedCandidates();
            alert('Failed to update status');
        }
    };

    const handleLabelUpdate = (candidateId: number, newLabels: Label[]) => {
        setSavedProfiles(prev => prev.map(p =>
            p.id === candidateId ? { ...p, labels: newLabels } : p
        ));
    };

    const filteredProfiles = savedProfiles.filter(profile => {
        const statusMatch = selectedStatus === 'all' || (profile.status || 'new') === selectedStatus;
        const labelMatch = selectedLabelId === null || (profile.labels && profile.labels.some(l => l.id === selectedLabelId));
        return statusMatch && labelMatch;
    });

    const statuses = [
        { id: 'all', label: 'All' },
        { id: 'new', label: 'New' },
        { id: 'contacted', label: 'Contacted' },
        { id: 'replied', label: 'Replied' },
        { id: 'interviewing', label: 'Interviewing' },
        { id: 'hired', label: 'Hired' },
        { id: 'rejected', label: 'Rejected' },
    ];

    if (loading) {
        return (
            <div className={`w-full mx-auto transition-all duration-300 ${viewMode === 'grid' ? 'max-w-7xl' : 'w-full px-4'}`}>
                <div className="flex items-center gap-3 pb-6 border-b border-slate-800/50 mb-8">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                        <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Saved Candidates</h2>
                        <p className="text-slate-400">Loading your shortlist...</p>
                    </div>
                </div>


                {viewMode === 'grid' ? (
                    <div className="flex flex-wrap justify-center gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-md">
                                <SkeletonCard />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 w-full bg-slate-900 rounded-xl border border-slate-800 animate-pulse" />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="pb-12">
            <div className={`w-full mx-auto transition-all duration-300 ${viewMode === 'grid' ? 'max-w-7xl' : 'w-full px-4'}`}>
                <div className="flex items-center gap-3 pb-6 border-b border-slate-800/50 mb-8">
                    <div className="p-2 bg-pink-500/10 rounded-lg">
                        <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Saved Candidates</h2>
                        <p className="text-slate-400">Your shortlisted developers</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button
                                onClick={() => downloadCSV(filteredProfiles)}
                                disabled={filteredProfiles.length === 0}
                                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export as CSV"
                            >
                                CSV
                            </button>
                            <div className="w-[1px] bg-slate-700 my-1" />
                            <button
                                onClick={() => downloadJSON(filteredProfiles)}
                                disabled={filteredProfiles.length === 0}
                                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export as JSON"
                            >
                                JSON
                            </button>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Candidate
                        </button>
                    </div>
                </div>

                <Link
                    to="/"
                    className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-8 transition-colors inline-block"
                >
                    ← Back to Search
                </Link>
            </div>

            {/* Controls Row */}
            <div className={`w-full mx-auto mb-8 flex flex-col sm:flex-row sm:flex-wrap gap-4 items-start sm:items-center justify-between transition-all duration-300 ${viewMode === 'grid' ? 'max-w-7xl' : 'w-full px-4'}`}>
                {/* Filters Group */}
                <div className="flex flex-col gap-4 w-full sm:w-auto">
                    {/* Status Filter */}
                    <div className="flex flex-wrap gap-2">
                        {statuses.map(status => (
                            <button
                                key={status.id}
                                onClick={() => setSelectedStatus(status.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedStatus === status.id
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>

                    {/* Label Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-3 h-3" /> Labels:
                        </span>
                        <button
                            onClick={() => setSelectedLabelId(null)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${selectedLabelId === null
                                ? 'bg-slate-200 text-slate-900'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                        >
                            All
                        </button>
                        {availableLabels.map(label => (
                            <button
                                key={label.id}
                                onClick={() => setSelectedLabelId(label.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 ${selectedLabelId === label.id
                                    ? 'ring-2 ring-white'
                                    : 'hover:opacity-80'
                                    }`}
                                style={{
                                    backgroundColor: `${label.color}20`,
                                    color: label.color,
                                    border: `1px solid ${label.color}40`
                                }}
                            >
                                {label.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Controls Group */}
                <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center flex-shrink-0">
                    <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 h-[42px] gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                ? 'bg-indigo-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                                ? 'bg-indigo-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {viewMode === 'list' && (
                        <ColumnSelector visibleColumns={visibleColumns} onToggleColumn={toggleColumn} />
                    )}
                </div>
            </div>

            <div className={`w-full mx-auto transition-all duration-300 ${viewMode === 'grid' ? 'max-w-7xl' : 'w-full px-4'}`}>
                {filteredProfiles.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/50 border-dashed">
                        <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-300 mb-2">No candidates found</h3>
                        <p className="text-slate-500">
                            Try adjusting your filters.
                        </p>
                    </div>
                ) : (
                    <PackageList
                        results={filteredProfiles}
                        title=""
                        viewMode={viewMode}
                        onStatusChange={handleStatusChange}
                        onLabelUpdate={handleLabelUpdate}
                        visibleColumns={visibleColumns}
                        // Passing fetchSavedCandidates as onRemove ensures that if a candidate is removed, 
                        // the list is refreshed (or we could manage state locally)
                        // Actually, the optimistic updates in `DeveloperRow/Card` call `onRemove` which `PackageList` expects.
                        onRemove={(candidate) => {
                            setSavedProfiles(prev => prev.filter(p => p.id !== candidate.id));
                        }}
                    />
                )}
            </div>

            {/* Add Candidate Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Add by GitHub Username</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCandidate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">GitHub Username</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={newCandidateUsername}
                                        onChange={(e) => setNewCandidateUsername(e.target.value)}
                                        placeholder="e.g. torvalds"
                                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={addLoading || !newCandidateUsername.trim()}
                                className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {addLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Add Candidate
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
