export interface GithubUser {
    login: string;
    avatar_url: string;
    html_url: string;
    name: string | null;
    company: string | null;
    blog: string | null;
    location: string | null;
    email: string | null;
    bio: string | null;
    twitter_username: string | null;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
}

interface CacheEntry {
    data: GithubUser | null;
    timestamp: number;
}

const CACHE_KEY = 'github_user_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCache(): Record<string, CacheEntry> {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
        return {};
    }
}

function setCache(username: string, data: GithubUser | null) {
    const cache = getCache();
    cache[username] = {
        data,
        timestamp: Date.now()
    };
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn('Failed to save to localStorage cache', e);
    }
}

export async function getGithubUser(username: string): Promise<GithubUser | null> {
    const cache = getCache();
    const entry = cache[username];

    if (entry && (Date.now() - entry.timestamp < CACHE_DURATION)) {
        return entry.data;
    }

    try {
        const { data: { session } } = await import('./supabase').then(m => m.supabase.auth.getSession());
        const token = session?.provider_token;

        const headers: HeadersInit = {};

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`https://api.github.com/users/${username}`, { headers });
        if (!response.ok) {
            if (response.status === 404) {
                setCache(username, null);
                return null;
            }
            if (response.status === 403) {
                throw new Error('RATE_LIMIT_EXCEEDED');
            }
            // Other errors
            console.warn(`GitHub API error for ${username}: ${response.status}`);
            return null;
        }
        const data = await response.json();
        setCache(username, data);
        return data;
    } catch (error: any) {
        if (error.message === 'RATE_LIMIT_EXCEEDED') {
            throw error;
        }
        console.error(`Failed to fetch GitHub user ${username}:`, error);
        return null;
    }
}
