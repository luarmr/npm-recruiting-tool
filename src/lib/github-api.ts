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

const CACHE = new Map<string, GithubUser | null>();

export async function getGithubUser(username: string): Promise<GithubUser | null> {
    if (CACHE.has(username)) {
        return CACHE.get(username) || null;
    }

    try {
        const response = await fetch(`https://api.github.com/users/${username}`);
        if (!response.ok) {
            if (response.status === 404) {
                CACHE.set(username, null);
                return null;
            }
            // Rate limit or other error
            console.warn(`GitHub API error for ${username}: ${response.status}`);
            return null;
        }
        const data = await response.json();
        CACHE.set(username, data);
        return data;
    } catch (error) {
        console.error(`Failed to fetch GitHub user ${username}:`, error);
        return null;
    }
}
