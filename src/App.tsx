import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SearchInput } from './components/SearchInput';
import { PackageList } from './components/PackageList';
import { getPackagesByTopic } from './lib/npm-api';
import type { NpmSearchResult } from './types';
import { Loader2, LayoutGrid, List } from 'lucide-react';

function App() {
  const [results, setResults] = useState<NpmSearchResult[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Heuristic to filter out organizations
  const isOrganization = (result: NpmSearchResult) => {
    const { package: pkg } = result;
    const username = pkg.publisher?.username?.toLowerCase();
    if (!username) return false;

    // Common org keywords or exact matches
    const orgs = [
      'facebook', 'google', 'microsoft', 'angular', 'react', 'vue', 'npm', 'vercel', 'nextjs', 'aws', 'amazon',
      'salesforce', 'adobe', 'netflix', 'uber', 'airbnb', 'shopify', 'twitter', 'linkedin', 'dropbox',
      'atlassian', 'slack', 'square', 'stripe', 'twilio', 'auth0', 'heroku', 'netlify', 'cloudflare',
      'types', 'DefinitelyTyped', 'ionic', 'expo', 'firebase', 'sentry', 'algolia', 'datadog', 'newrelic',
      'grafana', 'elastic', 'hashicorp', 'terraform', 'kubernetes', 'docker', 'ansible', 'chef', 'puppet',
      'jenkins', 'gitlab', 'github', 'bitbucket', 'circleci', 'travis', 'codesandbox', 'stackblitz',
      'jetbrains', 'intellij', 'vscode', 'atom', 'sublime', 'vim', 'emacs', 'webstorm', 'phpstorm',
      'pycharm', 'rubymine', 'goland', 'rider', 'clion', 'appcode', 'datagrip', 'android', 'ios',
      'swift', 'kotlin', 'java', 'scala', 'groovy', 'clojure', 'haskell', 'erlang', 'elixir', 'lisp',
      'racket', 'scheme', 'fsharp', 'csharp', 'f#', 'c#', 'cpp', 'c++', 'c', 'objective-c', 'obj-c',
      'assembly', 'asm', 'fortran', 'cobol', 'pascal', 'ada', 'lua', 'perl', 'r', 'julia', 'matlab',
      'sas', 'spss', 'stata', 'excel', 'powerpoint', 'word', 'outlook', 'onenote', 'access', 'publisher',
      'visio', 'project', 'teams', 'skype', 'yammer', 'sharepoint', 'onedrive', 'bing', 'cortana', 'edge',
      'ie', 'chrome', 'firefox', 'safari', 'opera', 'brave', 'vivaldi', 'tor', 'chromium', 'webkit',
      'blink', 'gecko', 'trident', 'presto', 'khtml', 'tasman', 'marionette', 'golem', 'servant',
      'phantomjs', 'slimerjs', 'casperjs', 'zombie', 'jest', 'mocha', 'jasmine', 'karma', 'protractor',
      'cypress', 'puppeteer', 'playwright', 'selenium', 'webdriver', 'appium', 'detox', 'espresso',
      'xctest', 'junit', 'testng', 'nunit', 'xunit', 'phpunit', 'rspec', 'cucumber', 'behat', 'behave',
      'lettuce', 'robot', 'sikuli', 'autoit', 'autohotkey', 'winappdriver', 'ldtp', 'dogtail', 'white',
      'uiatomation', 'uiautomator', 'espresso', 'kif', 'earlgrey', 'calabash', 'frank', 'monkeytalk',
      'ranorex', 'testcomplete', 'uft', 'qtp', 'silk', 'sahi', 'watin', 'watir', 'capybara', 'poltergeist'
    ];

    if (orgs.includes(username)) return true;
    if (username.includes('bot') || username.includes('team') || username.includes('official')) return true;

    // If username matches package scope (e.g. @angular/core published by angular)
    if (pkg.name.startsWith(`@${username}/`)) return true;

    return false;
  };

  const handleSearch = async (searchQuery: string, isLoadMore = false) => {
    if (!isLoadMore) {
      setQuery(searchQuery);
      setOffset(0);
      setResults([]);
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchSize = 50; // Fetch larger batch to allow for heavy filtering
      const currentOffset = isLoadMore ? offset + fetchSize : 0;

      // Use 'optimal' sort to get the best mix of popularity and quality
      const response = await getPackagesByTopic(searchQuery, 'optimal', fetchSize, currentOffset);

      const seen = new Set<string>();

      // Add existing results to seen set if loading more
      if (isLoadMore) {
        results.forEach(r => {
          if (r.package.publisher?.username) seen.add(r.package.publisher.username);
        });
      }

      // Deduplicate sequentially
      const newResults = response.objects.filter(item => {
        const username = item.package.publisher?.username;
        if (!username || seen.has(username)) return false;
        if (isOrganization(item)) return false;
        seen.add(username);
        return true;
      });

      // Enrich with GitHub data (limited to first 10 to avoid rate limits)
      // We do this optimistically and update state when data arrives
      const enrichedResults = await Promise.all(newResults.map(async (result, index) => {
        if (index >= 15) return result; // Only fetch for top 15

        const username = result.package.publisher?.username;
        let githubUsername = username;

        // Try to extract from repo URL if publisher name doesn't match a github user
        if (result.package.links.repository) {
          const match = result.package.links.repository.match(/github\.com\/([^\/]+)/);
          if (match && match[1]) {
            githubUsername = match[1];
          }
        }

        if (githubUsername) {
          try {
            const { getGithubUser } = await import('./lib/github-api');
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

    } catch (err) {
      console.error(err);
      setError('Failed to fetch results. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial discovery search
  useEffect(() => {
    handleSearch('react, typescript');
  }, []);



  return (
    <Layout>
      <div className="flex flex-col items-center gap-6 mb-8">
        <SearchInput onSearch={(q) => handleSearch(q, false)} isLoading={isLoading} />
      </div>

      {error && (
        <div className="text-center text-red-400 mb-8 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <div className="space-y-12">
        {query && !isLoading && (
          <div className="flex flex-col items-center justify-center mb-8 pb-4 border-b border-slate-800/50 gap-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-200">
                Candidates for <span className="text-indigo-400">"{query}"</span>
              </h2>
              <span className="text-sm text-slate-500">
                Showing {results.length} distinct profiles
              </span>
            </div>

            {/* View Toggle */}
            <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isLoading && !results.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-400">Searching the registry...</p>
          </div>
        ) : (
          <>
            <div className="space-y-16">
              <PackageList results={results} title="Top Candidates" viewMode={viewMode} />
            </div>

            {/* Load More Button */}
            {results.length > 0 && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => handleSearch(query, true)}
                  disabled={isLoading}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isLoading ? 'Loading more...' : 'Load More Candidates'}
                </button>
              </div>
            )}

            {!query && results.length === 0 && !isLoading && (
              <div className="text-center py-24 px-4 rounded-3xl bg-slate-900/30 border border-slate-800/50 border-dashed max-w-2xl mx-auto">
                <h3 className="text-xl font-medium text-slate-300 mb-2">Start Your Search</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Enter a technology stack (e.g., "react, typescript, ai") to discover qualified candidates.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default App;
