import { useState } from 'react';
import { getPackagesByTopic } from '../lib/npm-api';
import { searchPyPI } from '../lib/pypi-api';
import type { CandidateResult } from '../types';
import { useViewMode } from './useViewMode';

export type SearchSource = 'npm' | 'pypi';

export function useNpmSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CandidateResult[]>([]);
    const [loading, setIsLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const { viewMode, setViewMode } = useViewMode();
    const [hasMore, setHasMore] = useState(true);
    const [source, setSource] = useState<SearchSource>('npm');

    // Heuristic to filter out organizations
    const isOrganization = (result: CandidateResult) => {
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

    const search = async (searchQuery: string, isLoadMore = false, searchSource: SearchSource = source) => {
        if (!searchQuery.trim()) return;

        if (!isLoadMore) {
            setQuery(searchQuery);
            setOffset(0);
            setResults([]);
            setHasMore(true);
            setSource(searchSource);
        }

        setIsLoading(true);
        setError(null);

        try {
            const fetchSize = 50;
            const currentOffset = isLoadMore ? offset + fetchSize : 0;

            let newResults: CandidateResult[] = [];

            if (searchSource === 'npm') {
                const results = await getPackagesByTopic(searchQuery, 'optimal', fetchSize, currentOffset);
                if (results.length < fetchSize) {
                    setHasMore(false);
                }
                newResults = results.map(obj => ({ ...obj, source: 'npm' as const }));
            } else {
                // PyPI Search
                const results = await searchPyPI(searchQuery, currentOffset);
                if (results.length < fetchSize) {
                    setHasMore(false);
                }
                newResults = results;
            }

            const seen = new Set<string>();
            if (isLoadMore) {
                results.forEach(r => {
                    if (r.package.publisher?.username) seen.add(r.package.publisher.username);
                });
            }

            const filteredResults = newResults.filter(item => {
                const username = item.package.publisher?.username;
                if (!username || seen.has(username)) return false;
                if (isOrganization(item)) return false;
                seen.add(username);
                return true;
            });

            // Enrich with GitHub data (only for NPM, PyPI already does it)
            const enrichedResults = searchSource === 'npm' ? await Promise.all(filteredResults.map(async (result, index) => {
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
                                    name: githubUser.name || undefined,
                                    avatar_url: githubUser.avatar_url || undefined,
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
            })) : filteredResults;

            if (isLoadMore) {
                setResults(prev => [...prev, ...enrichedResults]);
                setOffset(currentOffset);
            } else {
                setResults(enrichedResults);
                setOffset(0);
            }

        } catch (err: any) {
            console.error(err);
            if (err.message === 'RATE_LIMIT_EXCEEDED') {
                setError('RATE_LIMIT_EXCEEDED');
            } else {
                setError('Failed to fetch results. Please try again.');
            }
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
        setViewMode,
        source,
        setSource
    };
}
