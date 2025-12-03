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

export interface NpmSearchResult {
    package: NpmPackage;
    score: NpmScore;
    searchScore: number;
    githubUser?: {
        location?: string;
        bio?: string;
        company?: string;
        twitter_username?: string;
        followers?: number;
        following?: number;
        public_repos?: number;
    };
}

export interface NpmSearchResponse {
    objects: NpmSearchResult[];
    total: number;
    time: string;
}

export type SortOption = 'optimal' | 'popularity' | 'maintenance' | 'quality';
