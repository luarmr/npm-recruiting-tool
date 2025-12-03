import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PackageList } from './PackageList';
import { type NpmSearchResult } from '../types';
import { Loader2, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
// import { Layout } from './Layout';


export function SavedCandidates() {
    const [savedProfiles, setSavedProfiles] = useState<NpmSearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    useEffect(() => {
        fetchSavedCandidates();
    }, []);

    const fetchSavedCandidates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('saved_candidates')
                .select('*, profiles(email)');

            if (error) throw error;

            // Transform DB data back to NpmSearchResult format
            const results: NpmSearchResult[] = data.map(item => ({
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
                status: item.status
            }));

            setSavedProfiles(results);
        } catch (error) {
            console.error('Error fetching saved candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProfiles = selectedStatus === 'all'
        ? savedProfiles
        : savedProfiles.filter(profile => (profile.status || 'new') === selectedStatus);

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
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-400">Loading saved profiles...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-800/50">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                    <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Saved Candidates</h2>
                    <p className="text-slate-400">Your shortlisted developers</p>
                </div>
            </div>

            <Link
                to="/"
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2 mb-4 transition-colors inline-block"
            >
                ← Back to Search
            </Link>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
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

            {filteredProfiles.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/50 border-dashed">
                    <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-slate-300 mb-2">No candidates found</h3>
                    <p className="text-slate-500">
                        {selectedStatus === 'all'
                            ? "Star candidates from the search results to add them to your list."
                            : `No candidates with status "${statuses.find(s => s.id === selectedStatus)?.label}".`}
                    </p>
                </div>
            ) : (
                <PackageList results={filteredProfiles} title="" viewMode="grid" />
            )}
        </div>
    );
}
