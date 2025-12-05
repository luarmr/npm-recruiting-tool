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
    linkedinUrl?: string;
    twitterUsername?: string;
    location?: string;
    company?: string;
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
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        location: '',
        company: '',
        linkedinUrl: '',
        twitterUsername: ''
    });

    const { assignLabel, removeLabel } = useLabels(candidate?.team_id); // team_id might be null initially

    const handleSaveProfile = async () => {
        if (!candidate) return;
        try {
            const { error } = await supabase
                .from('saved_candidates')
                .update({
                    location: editForm.location,
                    company: editForm.company,
                    linkedin_url: editForm.linkedinUrl,
                    twitter_username: editForm.twitterUsername
                })
                .eq('id', candidate.id);

            if (error) throw error;

            setCandidate(prev => prev ? {
                ...prev,
                ...editForm
            } : null);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

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

            // Map labels and new fields
            const transformedData = {
                ...data,
                labels: data.saved_candidate_labels?.map((scl: any) => scl.label) || [],
                linkedinUrl: data.linkedin_url,
                twitterUsername: data.twitter_username,
                location: data.location,
                company: data.company
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
                        <div className="flex gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-slate-800 overflow-hidden border-2 border-slate-700">
                                <img
                                    src={candidate.github_user_data?.avatar_url || `https://github.com/${candidate.publisher_username}.png`}
                                    alt={candidate.publisher_username}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {candidate.github_user_data?.name || candidate.publisher_username}
                                </h1>

                                {/* Editable Metadata Fields */}
                                <div className="space-y-2">
                                    {isEditing ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <input
                                                type="text"
                                                placeholder="Location"
                                                value={editForm.location}
                                                onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Company"
                                                value={editForm.company}
                                                onChange={e => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="LinkedIn URL"
                                                value={editForm.linkedinUrl}
                                                onChange={e => setEditForm(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Twitter Handle"
                                                value={editForm.twitterUsername}
                                                onChange={e => setEditForm(prev => ({ ...prev, twitterUsername: e.target.value }))}
                                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {candidate.location || candidate.github_user_data?.location || 'Unknown Location'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                {candidate.company || candidate.github_user_data?.company || 'Unknown Company'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
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
                                {candidate.linkedinUrl && !isEditing && (
                                    <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 text-[#0077b5] rounded-lg transition-colors">
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                    </a>
                                )}
                                {candidate.twitterUsername && !isEditing && (
                                    <a href={`https://twitter.com/${candidate.twitterUsername}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-lg transition-colors">
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                    </a>
                                )}
                            </div>

                            <button
                                onClick={isEditing ? handleSaveProfile : () => {
                                    setEditForm({
                                        location: candidate.location || candidate.github_user_data?.location || '',
                                        company: candidate.company || candidate.github_user_data?.company || '',
                                        linkedinUrl: candidate.linkedinUrl || '',
                                        twitterUsername: candidate.twitterUsername || ''
                                    });
                                    setIsEditing(true);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${isEditing
                                    ? 'bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                            >
                                {isEditing ? 'Save Changes' : 'Edit Profile'}
                            </button>
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
    );
}
