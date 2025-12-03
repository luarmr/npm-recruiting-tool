import type { CandidateResult } from '../types';
import { getGithubUser } from './github-api';

const GITHUB_API_BASE = 'https://api.github.com';

interface GithubRepoSearchResponse {
    items: {
        name: string;
        full_name: string;
        description: string;
        html_url: string;
        stargazers_count: number;
        language: string;
        updated_at: string;
        owner: {
            login: string;
            avatar_url: string;
        };
    }[];
}

export async function searchPyPI(query: string, offset = 0): Promise<CandidateResult[]> {
    // Search GitHub for Python repositories
    const response = await fetch(
        `${GITHUB_API_BASE}/search/repositories?q=${encodeURIComponent(query)}+language:python&sort=stars&order=desc&per_page=50&page=${Math.floor(offset / 50) + 1}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch from GitHub');
    }

    const data: GithubRepoSearchResponse = await response.json();

    const results: CandidateResult[] = await Promise.all(data.items.map(async (item) => {
        // Fetch full user details to get location, etc.
        const user = await getGithubUser(item.owner.login);

        return {
            package: {
                name: item.name,
                version: 'latest', // GitHub doesn't give us version easily
                description: item.description || '',
                keywords: ['python', item.language],
                date: item.updated_at,
                links: {
                    npm: `https://pypi.org/project/${item.name}/`, // Best guess link
                    repository: item.html_url,
                    homepage: item.html_url
                },
                publisher: {
                    username: item.owner.login,
                    email: '' // Not available
                },
                maintainers: [],
                author: {
                    name: item.owner.login
                }
            },
            score: {
                final: item.stargazers_count / 1000, // Normalized score
                detail: {
                    quality: item.stargazers_count / 1000,
                    popularity: item.stargazers_count / 1000,
                    maintenance: 1.0
                }
            },
            searchScore: item.stargazers_count,
            githubUser: user ? {
                name: user.name || undefined,
                avatar_url: user.avatar_url || undefined,
                location: user.location || undefined,
                bio: user.bio || undefined,
                company: user.company || undefined,
                twitter_username: user.twitter_username || undefined,
                followers: user.followers,
                following: user.following,
                public_repos: user.public_repos
            } : undefined,
            source: 'pypi'
        };
    }));

    return results;
}
