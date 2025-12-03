import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutGrid, List } from 'lucide-react';
import { Layout } from './components/Layout';
import { SearchInput } from './components/SearchInput';
import { PackageList } from './components/PackageList';
import { SavedCandidates } from './components/SavedCandidates';
import { TeamSettings } from './components/TeamSettings';
import { CandidateDetail } from './components/CandidateDetail';
import { useNpmSearch } from './hooks/useNpmSearch';
import { useEffect } from 'react';

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
  } = useNpmSearch();

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

      <div className={`w-full mx-auto mb-12 flex gap-4 transition-all duration-300 ${viewMode === 'grid' ? 'max-w-3xl' : 'w-full px-4'}`}>
        <div className="flex-grow">
          <SearchInput onSearch={handleSearch} />
        </div>
        <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 h-[52px]">
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
      </div>

      {error && (
        <div className="w-full max-w-3xl p-4 mb-8 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center mx-auto">
          {error}
        </div>
      )}

      <div className={`w-full mx-auto transition-all duration-300 ${viewMode === 'grid' ? 'max-w-7xl' : 'w-full px-4'}`}>
        <PackageList
          results={results}
          title={results.length > 0 ? "Search Results" : undefined}
          viewMode={viewMode}
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
  );
}

export default App;
