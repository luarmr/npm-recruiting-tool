export interface NpmPackage {
    name: string;
    version: string;
    description: string;
    keywords?: string[];
    date: string;
    links: {
        npm: string;
        homepage?: string;
        repository?: string;
        bugs?: string;
    };
    author?: {
        name: string;
        email?: string;
        url?: string;
    };
    publisher?: {
        username: string;
        email: string;
    };
    maintainers?: {
        username: string;
        email: string;
    }[];
}

export interface NpmScore {
    final: number;
    detail: {
        quality: number;
        popularity: number;
        maintenance: number;
    };
}

export type Status = 'new' | 'contacted' | 'replied' | 'interviewing' | 'hired' | 'rejected';

export interface CandidateResult {
    package: NpmPackage;
    score: NpmScore;
    searchScore: number;
    githubUser?: {
        name?: string;
        avatar_url?: string;
        location?: string;
        bio?: string;
        company?: string;
        twitter_username?: string;
        followers?: number;
        following?: number;
        public_repos?: number;
    };
    savedBy?: string; // Email of the user who saved this candidate
    status?: Status;
    id?: number; // Database ID for saved candidates
    source: 'npm' | 'pypi' | 'github';
    labels?: Label[];
    // Manual overrides / enrichment
    linkedinUrl?: string;
    twitterUsername?: string;
    location?: string;
    company?: string;
}

export interface NpmSearchResponse {
    objects: CandidateResult[];
    total: number;
    time: string;
}

export type SortOption = 'optimal' | 'popularity' | 'maintenance' | 'quality';

export interface Label {
    id: number;
    name: string;
    color: string;
    team_id?: string;
    user_id?: string;
}
