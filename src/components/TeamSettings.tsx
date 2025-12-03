import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, LogOut, Plus, Clock, Trash2, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InviteUserSearch } from './InviteUserSearch';
import type { GithubUser } from '../lib/github-api';

interface Team {
    id: string;
    name: string;
    created_by: string;
}

interface Invitation {
    id: string;
    email: string;
    status: 'pending' | 'accepted' | 'declined';
    team_id: string;
    teams?: { name: string };
}

interface Profile {
    id: string;
    email: string;
}

export function TeamSettings() {
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [teamName, setTeamName] = useState('');
    const [selectedGithubUser, setSelectedGithubUser] = useState<GithubUser | null>(null);

    const [members, setMembers] = useState<Profile[]>([]);
    const [sentInvites, setSentInvites] = useState<Invitation[]>([]);
    const [myInvites, setMyInvites] = useState<Invitation[]>([]);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setCurrentUser(user.id);

            // Fetch Team
            const { data: teamData } = await supabase
                .from('team_members')
                .select('teams (id, name, created_by)')
                .eq('user_id', user.id)
                .single();

            if (teamData && teamData.teams) {
                const currentTeam = Array.isArray(teamData.teams) ? teamData.teams[0] : teamData.teams;
                setTeam(currentTeam);
                await Promise.all([
                    fetchMembers(currentTeam.id),
                    fetchSentInvites(currentTeam.id)
                ]);
            } else {
                await fetchMyInvites(user.email);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async (teamId: string) => {
        // 1. Get Member IDs
        const { data: memberIds } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId);

        if (!memberIds || memberIds.length === 0) return;

        const ids = memberIds.map(m => m.user_id);

        // 2. Get Profiles
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', ids);

        if (profiles) {
            setMembers(profiles);
        }
    };

    const fetchSentInvites = async (teamId: string) => {
        const { data } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('team_id', teamId)
            .eq('status', 'pending');
        if (data) setSentInvites(data as Invitation[]);
    };

    const fetchMyInvites = async (email?: string) => {
        if (!email) return;
        const { data } = await supabase
            .from('team_invitations')
            .select('*, teams(name)')
            .eq('email', email)
            .eq('status', 'pending');

        if (data) setMyInvites(data as Invitation[]);
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data: newTeam, error: teamError } = await supabase
                .from('teams')
                .insert({ name: teamName, created_by: user.id })
                .select()
                .single();

            if (teamError) throw teamError;

            const { error: memberError } = await supabase
                .from('team_members')
                .insert({ team_id: newTeam.id, user_id: user.id });

            if (memberError) throw memberError;

            setSuccessMsg('Team created successfully!');
            initialize();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !team) return;

            if (!selectedGithubUser) {
                setError('Please select a GitHub user to invite');
                return;
            }

            const inviteData = {
                team_id: team.id,
                created_by: user.id,
                email: null,
                github_username: selectedGithubUser.login
            };

            const { error } = await supabase
                .from('team_invitations')
                .insert(inviteData);

            if (error) throw error;

            setSelectedGithubUser(null);
            setSuccessMsg(`Invitation sent to @${selectedGithubUser.login}`);
            fetchSentInvites(team.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptInvite = async (invite: Invitation) => {
        setActionLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('team_members').insert({ team_id: invite.team_id, user_id: user.id });
            await supabase.from('team_invitations').update({ status: 'accepted' }).eq('id', invite.id);

            initialize();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeclineInvite = async (inviteId: string) => {
        setActionLoading(true);
        try {
            await supabase.from('team_invitations').update({ status: 'declined' }).eq('id', inviteId);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) fetchMyInvites(user.email);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        setActionLoading(true);
        try {
            if (!team) return;
            await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', userId);
            fetchMembers(team.id);
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!confirm('Are you sure you want to leave this team?')) return;
        setActionLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !team) return;

            await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', user.id);
            setTeam(null);
            setMembers([]);
            fetchMyInvites(user.email);
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <Link
                    to="/"
                    className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold text-white">Team Management</h1>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    {successMsg}
                </div>
            )}

            {team ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Team Info & Invite */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{team.name}</h2>
                                    <p className="text-slate-400 text-sm mt-1">Manage your team and members</p>
                                </div>
                                <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20">
                                    {members.length} Members
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Invite New Member</h3>
                                <form onSubmit={handleInvite} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-slate-400">Search by GitHub Username</label>
                                        <InviteUserSearch
                                            onSelect={setSelectedGithubUser}
                                            selectedUser={selectedGithubUser}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={actionLoading || !selectedGithubUser}
                                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {selectedGithubUser ? `Invite @${selectedGithubUser.login}` : 'Select a user to invite'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-400" />
                                Team Members
                            </h3>
                            <div className="space-y-3">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between bg-slate-800/30 p-4 rounded-xl border border-slate-800/50 group hover:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                                {member.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">{member.email}</div>
                                                {member.id === team.created_by && (
                                                    <div className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5">
                                                        <Shield className="w-3 h-3" /> Team Owner
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {currentUser === team.created_by && member.id !== currentUser && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                disabled={actionLoading}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove Member"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pending Invites & Actions */}
                    <div className="space-y-8">
                        {sentInvites.length > 0 && (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Pending Invitations
                                </h3>
                                <div className="space-y-3">
                                    {sentInvites.map(invite => (
                                        <div key={invite.id} className="bg-slate-800/30 p-3 rounded-lg border border-slate-800/50 text-sm">
                                            <div className="text-slate-300 font-medium truncate" title={invite.email}>{invite.email}</div>
                                            <div className="text-xs text-slate-500 mt-1">Waiting for response...</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Danger Zone</h3>
                            <button
                                onClick={handleLeaveTeam}
                                disabled={actionLoading}
                                className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                Leave Team
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl mx-auto">
                    {/* No Team State */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Create a Team</h2>
                        <p className="text-slate-400 mb-8">Collaborate with your colleagues and share saved candidates in real-time.</p>

                        <form onSubmit={handleCreateTeam} className="max-w-md mx-auto">
                            <div className="mb-4 text-left">
                                <label className="block text-sm font-medium text-slate-300 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    placeholder="e.g. Engineering Alpha"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Create Team
                            </button>
                        </form>
                    </div>

                    {myInvites.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pl-2">Pending Invitations</h3>
                            {myInvites.map(invite => (
                                <div key={invite.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 flex items-center justify-between">
                                    <div>
                                        <div className="text-white font-bold text-lg">{invite.teams?.name}</div>
                                        <div className="text-sm text-slate-400">Invited you to join their team</div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDeclineInvite(invite.id)}
                                            disabled={actionLoading}
                                            className="px-4 py-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors font-medium"
                                        >
                                            Decline
                                        </button>
                                        <button
                                            onClick={() => handleAcceptInvite(invite)}
                                            disabled={actionLoading}
                                            className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors font-medium shadow-lg shadow-indigo-500/20"
                                        >
                                            Accept & Join
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
