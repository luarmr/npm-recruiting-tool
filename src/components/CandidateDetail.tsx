import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ExternalLink, Github, MapPin, MessageSquare, Send, Copy, Check, Users, TrendingUp } from 'lucide-react';
import { LabelBadge } from './LabelBadge';
import { LabelPicker } from './LabelPicker';
import { useLabels } from '../hooks/useLabels';
import type { Label } from '../types';

interface Note {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: {
        email: string;
    };
}

interface CandidateData {
    id: number;
    package_name: string;
    package_version: string;
    description: string;
    keywords: string[];
    date: string;
    npm_link: string;
    repository_link: string;
    homepage_link: string;
    publisher_username: string;
    publisher_email: string;
    score_final: number;
    score_quality: number;
    score_popularity: number;
    score_maintenance: number;
    github_user_data: any;
    status: string;
    user_id: string;
    team_id: string | null;
    profiles?: {
        email: string;
    };
    labels?: Label[];
}

export function CandidateDetail() {
    const { id } = useParams<{ id: string }>();
    // const navigate = useNavigate();
    const [candidate, setCandidate] = useState<CandidateData | null>(null);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [noteLoading, setNoteLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [graphError, setGraphError] = useState(false);

    const { assignLabel, removeLabel } = useLabels(candidate?.team_id); // team_id might be null initially

    useEffect(() => {
        if (id) fetchCandidate();
    }, [id]);

    const fetchCandidate = async () => {
        try {
            // Fetch Candidate
            const { data, error } = await supabase
                .from('saved_candidates')
                .select(`
                    *,
                    profiles(email),
                    saved_candidate_labels (
                        label: labels (*)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Map labels
            const transformedData = {
                ...data,
                labels: data.saved_candidate_labels?.map((scl: any) => scl.label) || []
            };

            setCandidate(transformedData);

            // Fetch Notes
            fetchNotes();
        } catch (err) {
            console.error(err);
            // navigate('/saved'); // Redirect if not found?
        } finally {
            setLoading(false);
        }
    };

    const fetchNotes = async () => {
        const { data } = await supabase
            .from('candidate_notes')
            .select('*, profiles(email)')
            .eq('saved_candidate_id', id)
            .order('created_at', { ascending: true });

        if (data) setNotes(data);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!candidate) return;

        const { error } = await supabase
            .from('saved_candidates')
            .update({ status: newStatus })
            .eq('id', candidate.id);

        if (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } else {
            setCandidate({ ...candidate, status: newStatus });
        }
    };

    const handleAssignLabel = async (label: Label) => {
        if (!candidate) return;
        try {
            await assignLabel(candidate.id, label.id);
            setCandidate(prev => prev ? {
                ...prev,
                labels: [...(prev.labels || []), label]
            } : null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleUnassignLabel = async (label: Label) => {
        if (!candidate) return;
        try {
            await removeLabel(candidate.id, label.id);
            setCandidate(prev => prev ? {
                ...prev,
                labels: (prev.labels || []).filter(l => l.id !== label.id)
            } : null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !candidate) return;

        setNoteLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { error } = await supabase
                .from('candidate_notes')
                .insert({
                    saved_candidate_id: candidate.id,
                    user_id: user.id,
                    content: newNote
                });

            if (error) {
                console.error('Error adding note:', error);
                alert('Failed to add note');
            } else {
                setNewNote('');
                fetchNotes();
            }
        }
        setNoteLoading(false);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>;
    }

    if (!candidate) return <div>Candidate not found</div>;

    const statusColors: Record<string, string> = {
        new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        replied: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        interviewing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        hired: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8 flex items-center justify-between">
                <Link to="/saved" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Saved
                </Link>
                <button
                    onClick={copyLink}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
                >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied Link' : 'Share Candidate'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex gap-6">
                                <div className="w-24 h-24 rounded-2xl bg-slate-800 overflow-hidden border-2 border-slate-700">
                                    <img
                                        src={candidate.github_user_data?.avatar_url || `https://github.com/${candidate.publisher_username}.png`}
                                        alt={candidate.publisher_username}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">
                                        {candidate.github_user_data?.name || candidate.publisher_username}
                                    </h1>
                                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                                        {candidate.github_user_data?.location && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" /> {candidate.github_user_data.location}
                                            </div>
                                        )}
                                        {candidate.github_user_data?.company && (
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" /> {candidate.github_user_data.company}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {candidate.repository_link && (
                                    <a href={candidate.repository_link} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <Github className="w-5 h-5" />
                                    </a>
                                )}
                                {candidate.homepage_link && (
                                    <a href={candidate.homepage_link} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none mb-8">
                            <p className="text-slate-300 text-lg">{candidate.description}</p>
                            {candidate.github_user_data?.bio && (
                                <p className="text-slate-400 italic border-l-2 border-slate-700 pl-4 mt-4">
                                    "{candidate.github_user_data.bio}"
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-8">
                            {candidate.keywords?.map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm border border-slate-700">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-slate-800 pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{candidate.github_user_data?.public_repos || '-'}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Repos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{candidate.github_user_data?.followers || '-'}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Followers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-white">{Math.round(candidate.score_final * 100)}</div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Score</div>
                            </div>
                        </div>
                    </div>

                    {/* GitHub Contribution Graph */}
                    {!graphError && (candidate.github_user_data?.login || candidate.publisher_username) && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                Contribution Activity
                            </h3>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 overflow-hidden">
                                <img
                                    src={`https://ghchart.rshah.org/4f46e5/${candidate.github_user_data?.login || candidate.publisher_username}`}
                                    alt="Contribution Graph"
                                    className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity"
                                    onError={() => setGraphError(true)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Status & Notes */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Outreach Status</h3>

                        <div className="mb-6">
                            <select
                                value={candidate.status || 'new'}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`w-full appearance-none px-4 py-3 rounded-xl border font-medium outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all ${statusColors[candidate.status || 'new']}`}
                            >
                                <option value="new">New Candidate</option>
                                <option value="contacted">Contacted</option>
                                <option value="replied">Replied</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                Labels
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {candidate.labels?.map(label => (
                                    <LabelBadge
                                        key={label.id}
                                        label={label}
                                        size="sm"
                                        onRemove={() => handleUnassignLabel(label)}
                                    />
                                ))}
                                <LabelPicker
                                    currentLabels={candidate.labels || []}
                                    onAssign={handleAssignLabel}
                                    onUnassign={handleUnassignLabel}
                                    teamId={candidate.team_id}
                                    align="left"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
                            <span>Saved by {candidate.profiles?.email}</span>
                            <span>{new Date(candidate.date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-[500px]">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Team Notes
                        </h3>

                        <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                            {notes.length === 0 ? (
                                <div className="text-center py-10 text-slate-600 italic text-sm">
                                    No notes yet. Start the discussion!
                                </div>
                            ) : (
                                notes.map(note => (
                                    <div key={note.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-indigo-400">{note.profiles?.email}</span>
                                            <span className="text-[10px] text-slate-600">{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleAddNote} className="relative">
                            <input
                                type="text"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Add a note..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={noteLoading || !newNote.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
