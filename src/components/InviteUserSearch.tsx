import { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus, X } from 'lucide-react';
import { getGithubUser, type GithubUser } from '../lib/github-api';
import { useDebounce } from '../hooks/useDebounce';

interface InviteUserSearchProps {
    onSelect: (user: GithubUser | null) => void;
    selectedUser: GithubUser | null;
}

export function InviteUserSearch({ onSelect, selectedUser }: InviteUserSearchProps) {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetchedUser, setFetchedUser] = useState<GithubUser | null>(null);

    const debouncedUsername = useDebounce(username, 500);

    useEffect(() => {
        if (!debouncedUsername.trim()) {
            setFetchedUser(null);
            setError(null);
            return;
        }

        // Don't re-fetch if it's the same user we already selected
        if (selectedUser && selectedUser.login.toLowerCase() === debouncedUsername.toLowerCase()) {
            return;
        }

        async function fetchUser() {
            setLoading(true);
            setError(null);
            try {
                const user = await getGithubUser(debouncedUsername);
                if (user) {
                    setFetchedUser(user);
                } else {
                    setFetchedUser(null);
                    setError('User not found');
                }
            } catch (err) {
                setFetchedUser(null);
                setError('Error fetching user');
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [debouncedUsername, selectedUser]);

    const handleClear = () => {
        setUsername('');
        setFetchedUser(null);
        onSelect(null);
        setError(null);
    };

    const handleSelect = () => {
        if (fetchedUser) {
            onSelect(fetchedUser);
            // Keep the username in the input but clear the fetched state to show "Selected" view
            // Actually, let's keep the fetched user as the source of truth for the UI
        }
    };

    if (selectedUser) {
        return (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                    <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.login}
                        className="w-10 h-10 rounded-full border border-indigo-500/30"
                    />
                    <div>
                        <div className="text-white font-medium flex items-center gap-2">
                            {selectedUser.name || selectedUser.login}
                            <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded">Selected</span>
                        </div>
                        <div className="text-xs text-indigo-300">@{selectedUser.login}</div>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="p-2 hover:bg-indigo-500/20 rounded-lg text-indigo-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if (!e.target.value) {
                            onSelect(null);
                            setFetchedUser(null);
                        }
                    }}
                    placeholder="Search GitHub username..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    </div>
                )}
            </div>

            {error && (
                <div className="text-xs text-red-400 px-1">
                    {error}
                </div>
            )}

            {fetchedUser && !loading && (
                <div
                    onClick={handleSelect}
                    className="bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 cursor-pointer rounded-xl p-3 flex items-center gap-3 transition-all group"
                >
                    <img
                        src={fetchedUser.avatar_url}
                        alt={fetchedUser.login}
                        className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">
                            {fetchedUser.name || fetchedUser.login}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                            @{fetchedUser.login} • {fetchedUser.bio || 'No bio'}
                        </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-indigo-500 text-white text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                            <UserPlus className="w-3 h-3" /> Select
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
