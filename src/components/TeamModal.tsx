import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Mail, Check, LogOut, Plus, X, Clock, Trash2, Shield } from 'lucide-react';

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

interface TeamMember {
    user_id: string;
    profiles: { email: string };
}

interface TeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTeam: Team | null;
    onTeamUpdate: () => void;
}

export function TeamModal({ isOpen, onClose, currentTeam, onTeamUpdate }: TeamModalProps) {
    const [, setMode] = useState<'view' | 'create'>('view');
    const [teamName, setTeamName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [sentInvites, setSentInvites] = useState<Invitation[]>([]);
    const [myInvites, setMyInvites] = useState<Invitation[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUser(user.id);
        });

        if (isOpen) {
            setMode(currentTeam ? 'view' : 'create');
            setError(null);
            setSuccessMsg(null);
            setTeamName('');
            setInviteEmail('');

            if (currentTeam) {
                fetchSentInvites(currentTeam.id);
                fetchMembers(currentTeam.id);
            } else {
                fetchMyInvites();
            }
        }
    }, [isOpen, currentTeam]);

    const fetchMembers = async (teamId: string) => {
        const { data } = await supabase
            .from('team_members')
            .select('user_id, profiles(email)')
            .eq('team_id', teamId);

        if (data) {
            // @ts-ignore
            setMembers(data);
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

    const fetchMyInvites = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) return;

        const { data } = await supabase
            .from('team_invitations')
            .select('*, teams(name)')
            .eq('email', user.email)
            .eq('status', 'pending');

        if (data) setMyInvites(data as Invitation[]);
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Create Team
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({
                    name: teamName,
                    created_by: user.id
                })
                .select()
                .single();

            if (teamError) throw teamError;

            // 2. Add user to team
            const { error: memberError } = await supabase
                .from('team_members')
                .insert({ team_id: team.id, user_id: user.id });

            if (memberError) throw memberError;

            onTeamUpdate();
            setMode('view');
            setSuccessMsg('Team created! Now invite your colleagues.');
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !currentTeam) return;

            const { error } = await supabase
                .from('team_invitations')
                .insert({
                    team_id: currentTeam.id,
                    email: inviteEmail,
                    created_by: user.id
                });

            if (error) throw error;

            setInviteEmail('');
            setSuccessMsg(`Invitation sent to ${inviteEmail}`);
            fetchSentInvites(currentTeam.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvite = async (invite: Invitation) => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error: joinError } = await supabase
                .from('team_members')
                .insert({ team_id: invite.team_id, user_id: user.id });

            if (joinError) throw joinError;

            await supabase
                .from('team_invitations')
                .update({ status: 'accepted' })
                .eq('id', invite.id);

            onTeamUpdate();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeclineInvite = async (inviteId: string) => {
        setLoading(true);
        try {
            await supabase
                .from('team_invitations')
                .update({ status: 'declined' })
                .eq('id', inviteId);

            fetchMyInvites();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        setLoading(true);
        try {
            if (!currentTeam) return;

            await supabase
                .from('team_members')
                .delete()
                .eq('team_id', currentTeam.id)
                .eq('user_id', userId);

            fetchMembers(currentTeam.id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!confirm('Are you sure you want to leave this team?')) return;
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !currentTeam) return;

            await supabase
                .from('team_members')
                .delete()
                .eq('team_id', currentTeam.id)
                .eq('user_id', user.id);

            onTeamUpdate();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        {currentTeam ? 'Your Team' : 'Team Collaboration'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                            {successMsg}
                        </div>
                    )}

                    {currentTeam ? (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Name</label>
                                <div className="text-xl font-medium text-white mt-1">{currentTeam.name}</div>
                            </div>

                            {/* Members List */}
                            <div>
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Team Members</h3>
                                <div className="space-y-2">
                                    {members.map(member => (
                                        <div key={member.user_id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                    {member.profiles?.email?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-slate-200">{member.profiles?.email}</span>
                                                    {member.user_id === currentTeam.created_by && (
                                                        <span className="text-[10px] text-indigo-400 flex items-center gap-1">
                                                            <Shield className="w-3 h-3" /> Owner
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Remove Button: Only for Owner, cannot remove self */}
                                            {currentUser === currentTeam.created_by && member.user_id !== currentUser && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    disabled={loading}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Remove Member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800">
                                <h3 className="text-sm font-medium text-slate-300 mb-3">Invite Member</h3>
                                <form onSubmit={handleInvite} className="flex gap-2">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@company.com"
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Invite
                                    </button>
                                </form>
                            </div>

                            {sentInvites.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pending Invitations</h3>
                                    <div className="space-y-2">
                                        {sentInvites.map(invite => (
                                            <div key={invite.id} className="flex items-center justify-between text-sm bg-slate-800/30 p-2 rounded-lg border border-slate-800">
                                                <span className="text-slate-300">{invite.email}</span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Pending
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleLeaveTeam}
                                disabled={loading}
                                className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium mt-4"
                            >
                                <LogOut className="w-4 h-4" />
                                Leave Team
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* My Invitations */}
                            {myInvites.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-indigo-400" />
                                        Pending Invitations
                                    </h3>
                                    <div className="space-y-3">
                                        {myInvites.map(invite => (
                                            <div key={invite.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="text-white font-medium">{invite.teams?.name}</div>
                                                    <div className="text-xs text-slate-400">Invited you to join</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDeclineInvite(invite.id)}
                                                        disabled={loading}
                                                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                                        title="Decline"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAcceptInvite(invite)}
                                                        disabled={loading}
                                                        className="p-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white transition-colors"
                                                        title="Accept"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Users className="w-6 h-6 text-slate-500" />
                                </div>
                                <h3 className="text-lg font-medium text-white">Create a Team</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    Collaborate with your colleagues and share saved candidates.
                                </p>
                            </div>

                            <form onSubmit={handleCreateTeam} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Team Name</label>
                                    <input
                                        type="text"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="e.g. Engineering Alpha"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Creating...' : (
                                        <>
                                            <Plus className="w-4 h-4" /> Create Team
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
