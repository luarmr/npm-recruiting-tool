import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutGrid, List, AlertTriangle, LogIn } from 'lucide-react';
import { Layout } from './components/Layout';
import { SearchInput } from './components/SearchInput';
import { PackageList } from './components/PackageList';
import { SavedCandidates } from './components/SavedCandidates';
import { TeamSettings } from './components/TeamSettings';
import { CandidateDetail } from './components/CandidateDetail';
import { useNpmSearch } from './hooks/useNpmSearch';
import { useColumnPreferences } from './hooks/useColumnPreferences';
import { ColumnSelector } from './components/ColumnSelector';
import { useEffect } from 'react';
import { AuthUIProvider, useAuthUI } from './context/AuthUIContext';

function SearchPage() {
  const {
    // query,
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
  } = useNpmSearch();
  const { visibleColumns, toggleColumn } = useColumnPreferences();
  const { openAuthModal } = useAuthUI();

  useEffect(() => {
    // Initial search if empty
    if (results.length === 0) {
      search('react, typescript');
    }
  }, []);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    search(newQuery);
  };

  return (
    <>
      <header className="mb-12 pt-12 text-center flex flex-col items-center">
        <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
          <span className="text-xs font-semibold tracking-wide text-indigo-400 uppercase">Talent Intelligence Platform</span>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
          NPM Candidate Search
        </h1>
        <p className="text-slate-400 text-lg">
          Find the best developers for your team based on their code.
        </p>
      </header>

      <div className={`w-full mx-auto mb-12 flex flex-col sm:flex-row gap-4 transition-all duration-300 ${viewMode === 'grid' ? 'max-w-3xl' : 'w-full px-4'}`}>
        <div className="flex-grow">
          <SearchInput
            onSearch={handleSearch}
            source={source}
            onSourceChange={setSource}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 h-[52px] gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${viewMode === 'list'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          {viewMode === 'list' && (
            <ColumnSelector visibleColumns={visibleColumns} onToggleColumn={toggleColumn} />
          )}
        </div>
      </div>

      {error && (
        <div className="w-full max-w-3xl mx-auto mb-8">
          {error === 'RATE_LIMIT_EXCEEDED' ? (
            <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">GitHub API Rate Limit Reached</h3>
              <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                You've hit the limit for anonymous searches (60/hour). To continue searching with higher limits (5,000/hour), please sign in with your GitHub account.
              </p>
              <button
                onClick={openAuthModal}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In with GitHub
              </button>
            </div>
          ) : (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}
        </div>
      )}

      <div className={`w-full mx-auto transition-all duration-300 ${viewMode === 'grid' ? 'max-w-7xl' : 'w-full px-4'}`}>
        <PackageList
          results={results}
          title={results.length > 0 ? "Search Results" : undefined}
          viewMode={viewMode}
          visibleColumns={visibleColumns}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {!loading && results.length > 0 && hasMore && (
        <div className="flex justify-center pb-12">
          <button
            onClick={loadMore}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium"
          >
            Load More Results
          </button>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthUIProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/saved" element={<SavedCandidates />} />
            <Route path="/team" element={<TeamSettings />} />
            <Route path="/candidate/:id" element={<CandidateDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthUIProvider>
  );
}

export default App;
