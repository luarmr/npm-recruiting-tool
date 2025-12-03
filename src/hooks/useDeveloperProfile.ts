import { useState } from 'react';
import type { NpmSearchResult } from '../types';

export function useDeveloperProfile(result: NpmSearchResult) {
    const { package: pkg, score } = result;

    // Extract GitHub username
    let githubUsername: string | undefined = undefined;

    if (pkg.links.repository) {
        const match = pkg.links.repository.match(/github\.com[:\/]([^\/]+)/);
        if (match && match[1]) {
            githubUsername = match[1];
        }
    }

    const [avatarError, setAvatarError] = useState(false);
    const [graphError, setGraphError] = useState(false);

    const avatarUrl = (githubUsername && !avatarError)
        ? `https://github.com/${githubUsername}.png`
        : `https://ui-avatars.com/api/?name=${pkg.publisher?.username || pkg.author?.name || 'User'}&background=random&color=fff`;

    const cleanRepoUrl = (url: string) => {
        if (!url) return undefined;
        return url
            .replace(/^git\+/, '')
            .replace(/^git:\/\//, 'https://')
            .replace(/\.git$/, '');
    };

    const githubProfileUrl = githubUsername
        ? `https://github.com/${githubUsername}`
        : (pkg.links.repository ? cleanRepoUrl(pkg.links.repository) : undefined);

    const { popularity = 0, quality = 0 } = score.detail;

    let impactLevel = 'Engineer';
    let impactColor = 'text-slate-400';
    let showTopTalent = false;

    if (quality > 0.8 && popularity > 0.1) {
        impactLevel = 'Senior Engineer';
        impactColor = 'text-blue-400';
    }
    if (quality > 0.9 && popularity > 0.3) {
        impactLevel = 'Senior Architect';
        impactColor = 'text-emerald-400';
        showTopTalent = true;
    }

    const hasVerifiedGithub = !!pkg.links.repository?.includes('github.com');

    return {
        githubUsername,
        avatarUrl,
        githubProfileUrl,
        impactLevel,
        impactColor,
        showTopTalent,
        hasVerifiedGithub,
        avatarError,
        setAvatarError,
        graphError,
        setGraphError,
        popularity,
        quality
    };
}
