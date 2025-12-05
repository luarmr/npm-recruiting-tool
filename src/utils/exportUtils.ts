import type { CandidateResult } from '../types';

export const flattenCandidate = (candidate: CandidateResult) => {
    return {
        id: candidate.id,
        name: candidate.githubUser?.name || candidate.package.publisher?.username || '',
        email: candidate.savedBy || candidate.package.publisher?.email || '',
        username: candidate.package.publisher?.username || '',
        status: candidate.status || 'new',
        score: Math.round(candidate.score.final * 100),
        labels: candidate.labels?.map((l: any) => l.name).join(', ') || '',
        location: candidate.location || candidate.githubUser?.location || '',
        company: candidate.company || candidate.githubUser?.company || '',
        linkedin_url: candidate.linkedinUrl || '',
        twitter_username: candidate.twitterUsername || '',
        github_url: candidate.package.links.repository || '',
        homepage: candidate.package.links.homepage || '',
        npm_link: candidate.package.links.npm || '',
        description: candidate.package.description || '',
        public_repos: candidate.githubUser?.public_repos || 0,
        followers: candidate.githubUser?.followers || 0,
        saved_date: new Date(candidate.package.date).toLocaleDateString()
    };
};

export const downloadCSV = (candidates: CandidateResult[]) => {
    if (!candidates.length) return;

    const flattened = candidates.map(flattenCandidate);
    const headers = Object.keys(flattened[0]);

    const csvContent = [
        headers.join(','),
        ...flattened.map(row => headers.map(header => {
            const value = (row as any)[header];
            // Handle strings that might contain commas or newlines
            const stringValue = String(value || '');
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `candidates_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const downloadJSON = (candidates: CandidateResult[]) => {
    if (!candidates.length) return;

    const dataStr = JSON.stringify(candidates, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `candidates_export_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
