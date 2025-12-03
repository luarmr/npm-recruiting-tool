import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';
import { type User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon, Heart, Users } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

interface Team {
    id: string;
    name: string;
    created_by: string;
}

export function Layout({ children }: LayoutProps) {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [team, setTeam] = useState<Team | null>(null);

    const [hasInvites, setHasInvites] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchTeam(session.user.id);
                checkInvites(session.user.email);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchTeam(session.user.id);
                checkInvites(session.user.email);
            } else {
                setTeam(null);
                setHasInvites(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchTeam = async (userId: string) => {
        const { data } = await supabase
            .from('team_members')
            .select('teams (id, name, created_by)')
            .eq('user_id', userId)
            .single();

        if (data && data.teams) {
            // @ts-ignore
            setTeam(data.teams);
        } else {
            setTeam(null);
        }
    };

    const checkInvites = async (email?: string) => {
        if (!email) return;
        const { count } = await supabase
            .from('team_invitations')
            .select('*', { count: 'exact', head: true })
            .eq('email', email)
            .eq('status', 'pending');

        setHasInvites(!!count && count > 0);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setTeam(null);
        setHasInvites(false);
    };

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col items-center">
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
            </div>

            {/* Top Navigation Bar */}
            <div className="relative z-20 w-full border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
                    <Link
                        to="/"
                        className="font-bold text-lg tracking-tight text-slate-200 cursor-pointer"
                    >
                        NPM <span className="text-indigo-400">Talent</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link
                                    to="/saved"
                                    className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    <Heart className="w-4 h-4" />
                                    Saved
                                </Link>

                                <Link
                                    to="/team"
                                    className={`text-sm transition-colors flex items-center gap-2 relative ${team ? 'text-indigo-400 hover:text-indigo-300' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Users className="w-4 h-4" />
                                    {team ? team.name : 'Team'}
                                    {hasInvites && !team && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                    )}
                                </Link>

                                <div className="h-4 w-px bg-slate-800"></div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <UserIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{user.email}</span>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="text-sm text-slate-400 hover:text-red-400 transition-colors ml-2"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsAuthOpen(true)}
                                className="text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl flex flex-col items-center w-full flex-grow">
                <main className="w-full flex-grow">
                    {children}
                </main>

                <footer className="mt-32 py-12 border-t border-slate-800/50 text-center w-full">
                    <p className="text-slate-600 text-sm">
                        &copy; {new Date().getFullYear()} NPM Talent Search. Designed for Hiring Managers.
                    </p>
                </footer>
            </div>
        </div>
    );
}
