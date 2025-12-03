import { useState, useEffect } from 'react';
import { getGithubUser, type GithubUser } from '../lib/github-api';
import { Mail } from 'lucide-react';

interface PendingInviteCardProps {
    email?: string | null;
    githubUsername?: string | null;
}

export function PendingInviteCard({ email, githubUsername }: PendingInviteCardProps) {
    const [user, setUser] = useState<GithubUser | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (githubUsername) {
            setLoading(true);
            getGithubUser(githubUsername)
                .then(u => setUser(u))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [githubUsername]);

    if (githubUsername) {
        if (loading) {
            return (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                    <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
                </div>
            );
        }

        if (user) {
            return (
                <div className="flex items-center gap-3">
                    <img
                        src={user.avatar_url}
                        alt={user.login}
                        className="w-8 h-8 rounded-full border border-slate-700"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="text-slate-200 font-medium truncate text-sm">
                            {user.name || user.login}
                        </div>
                        <div className="text-xs text-slate-500 truncate">@{user.login}</div>
                    </div>
                </div>
            );
        }

        // Fallback if user fetch fails but we have username
        return (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-500 font-mono">
                    {githubUsername.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-slate-300 font-medium text-sm">@{githubUsername}</div>
            </div>
        );
    }

    // Legacy email invite
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                <Mail className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-slate-300 font-medium truncate text-sm">{email}</div>
        </div>
    );
}
