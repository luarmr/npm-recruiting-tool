import type { NpmSearchResponse, SortOption } from '../types';

const REGISTRY_URL = 'https://registry.npmjs.org/-/v1/search';

export async function searchPackages(
    text: string,
    size: number = 20,
    from: number = 0,
    quality?: number,
    popularity?: number,
    maintenance?: number
): Promise<NpmSearchResponse> {
    const params = new URLSearchParams();
    params.append('text', text);
    params.append('size', size.toString());
    params.append('from', from.toString());

    if (quality !== undefined) params.append('quality', quality.toString());
    if (popularity !== undefined) params.append('popularity', popularity.toString());
    if (maintenance !== undefined) params.append('maintenance', maintenance.toString());

    const response = await fetch(`${REGISTRY_URL}?${params.toString()}`);

    if (!response.ok) {
        throw new Error(`NPM Registry API error: ${response.statusText}`);
    }

    return response.json();
}

export async function getPackagesByTopic(topic: string, sort: SortOption = 'optimal', size: number = 20, from: number = 0): Promise<NpmSearchResponse> {
    // Handle multi-term search (e.g., "react, redux, typescript")
    const terms = topic.split(',').map(t => t.trim()).filter(Boolean);

    // Construct query: prioritize keywords, but allow text match
    // If multiple terms, we want packages that match ALL or MOST of them.
    // NPM registry 'text' parameter handles space-separated terms as an implicit AND/OR mix depending on weight.
    // Using `keywords:term` is stricter.

    let query = '';
    if (terms.length > 1 || terms[0].includes(' ')) {
        // For multiple terms or terms with spaces (e.g. "react native"), use full-text search
        query = terms.join(' ');
    } else {
        // Single word term - prefer keyword search for precision
        query = `keywords:${topic}`;
    }

    let quality = 1.0;
    let popularity = 1.0;
    let maintenance = 1.0;

    switch (sort) {
        case 'popularity':
            popularity = 1.0;
            quality = 0.1;
            maintenance = 0.1;
            break;
        case 'maintenance': // Fresh
            maintenance = 1.0;
            popularity = 0.1;
            quality = 0.5;
            break;
        case 'quality':
            quality = 1.0;
            popularity = 0.5;
            maintenance = 0.5;
            break;
        case 'optimal':
        default:
            // Balanced
            break;
    }

    return searchPackages(query, size, from, quality, popularity, maintenance);
}
