import type { NpmSearchResult } from '../types';
import { DeveloperCard } from './DeveloperCard';

interface PackageListProps {
    results: NpmSearchResult[];
    title?: string;
}

export function PackageList({ results, title }: PackageListProps) {
    if (results.length === 0) {
        return null;
    }

    return (
        <div className="mb-12">
            {title && (
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                    {title}
                    <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                        {results.length}
                    </span>
                </h2>
            )}
            <div className="flex flex-wrap justify-center gap-6">
                {results.map((result, index) => (
                    <div key={`${result.package.name}-${index}`} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-md">
                        <DeveloperCard result={result} index={index} />
                    </div>
                ))}
            </div>
        </div>
    );
}
