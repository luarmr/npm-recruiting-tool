import type { NpmSearchResult } from '../types';
import { DeveloperCard } from './DeveloperCard';
import { DeveloperRow } from './DeveloperRow';

interface PackageListProps {
    results: NpmSearchResult[];
    title?: string;
    viewMode: 'grid' | 'list';
}

export function PackageList({ results, title, viewMode }: PackageListProps) {
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

            {viewMode === 'grid' ? (
                <div className="flex flex-wrap justify-center gap-6">
                    {results.map((result, index) => (
                        <div
                            key={`${result.package.name}-${index}`}
                            className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-md"
                        >
                            <DeveloperCard result={result} index={index} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400">
                                <th className="py-4 pl-4 font-medium w-16">Avatar</th>
                                <th className="py-4 px-4 font-medium">Name</th>
                                <th className="py-4 px-4 font-medium">Username</th>
                                <th className="py-4 px-4 font-medium">Bio</th>
                                <th className="py-4 px-4 font-medium text-center">Repos</th>
                                <th className="py-4 px-4 font-medium text-center">Followers</th>
                                <th className="py-4 px-4 font-medium">Location</th>
                                <th className="py-4 pr-4 font-medium w-64">Contributions (Last Year)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {results.map((result, index) => (
                                <DeveloperRow
                                    key={`${result.package.name}-${index}`}
                                    result={result}
                                    index={index}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
