import { useState } from 'react';
import { getPackagesByTopic } from '../lib/npm-api';
import type { NpmSearchResult } from '../types';
import { useViewMode } from './useViewMode';

export function useNpmSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<NpmSearchResult[]>([]);
    const [loading, setIsLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const { viewMode, setViewMode } = useViewMode();
    const [hasMore, setHasMore] = useState(true);

    // Heuristic to filter out organizations
    const isOrganization = (result: NpmSearchResult) => {
        const { package: pkg } = result;
        const username = pkg.publisher?.username?.toLowerCase();
        if (!username) return false;

        const orgs = [
            'facebook', 'google', 'microsoft', 'angular', 'react', 'vue', 'npm', 'vercel', 'nextjs', 'aws', 'amazon',
            'salesforce', 'adobe', 'netflix', 'uber', 'airbnb', 'shopify', 'twitter', 'linkedin', 'dropbox',
            'atlassian', 'slack', 'square', 'stripe', 'twilio', 'auth0', 'heroku', 'netlify', 'cloudflare',
            'types', 'DefinitelyTyped', 'ionic', 'expo', 'firebase', 'sentry', 'algolia', 'datadog', 'newrelic'
        ];

        if (orgs.includes(username)) return true;
        if (username.includes('bot') || username.includes('team') || username.includes('official')) return true;
        if (pkg.name.startsWith(`@${username}/`)) return true;

        return false;
    };

    const search = async (searchQuery: string, isLoadMore = false) => {
        if (!searchQuery.trim()) return;

        if (!isLoadMore) {
            setQuery(searchQuery);
            setOffset(0);
            setResults([]);
            setHasMore(true);
        }

        setIsLoading(true);
        setError(null);

        try {
            const fetchSize = 50;
            const currentOffset = isLoadMore ? offset + fetchSize : 0;

            const response = await getPackagesByTopic(searchQuery, 'optimal', fetchSize, currentOffset);

            if (response.objects.length < fetchSize) {
                setHasMore(false);
            }

            const seen = new Set<string>();
            if (isLoadMore) {
                results.forEach(r => {
                    if (r.package.publisher?.username) seen.add(r.package.publisher.username);
                });
            }

            const newResults = response.objects.filter(item => {
                const username = item.package.publisher?.username;
                if (!username || seen.has(username)) return false;
                if (isOrganization(item)) return false;
                seen.add(username);
                return true;
            });

            // Enrich with GitHub data
            const enrichedResults = await Promise.all(newResults.map(async (result, index) => {
                if (index >= 15) return result;

                const username = result.package.publisher?.username;
                let githubUsername = username;

                if (result.package.links.repository) {
                    const match = result.package.links.repository.match(/github\.com\/([^\/]+)/);
                    if (match && match[1]) {
                        githubUsername = match[1];
                    }
                }

                if (githubUsername) {
                    try {
                        const { getGithubUser } = await import('../lib/github-api');
                        const githubUser = await getGithubUser(githubUsername);
                        if (githubUser) {
                            return {
                                ...result,
                                githubUser: {
                                    location: githubUser.location || undefined,
                                    bio: githubUser.bio || undefined,
                                    company: githubUser.company || undefined,
                                    twitter_username: githubUser.twitter_username || undefined,
                                    followers: githubUser.followers,
                                    following: githubUser.following,
                                    public_repos: githubUser.public_repos
                                }
                            };
                        }
                    } catch (e) {
                        // Ignore errors
                    }
                }
                return result;
            }));

            if (isLoadMore) {
                setResults(prev => [...prev, ...enrichedResults]);
                setOffset(currentOffset);
            } else {
                setResults(enrichedResults);
                setOffset(0);
            }

        } catch (err: any) {
            console.error(err);
            setError('Failed to fetch results. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = () => {
        search(query, true);
    };

    return {
        query,
        setQuery,
        results,
        loading,
        error,
        search,
        loadMore,
        hasMore,
        viewMode,
        setViewMode
    };
}
