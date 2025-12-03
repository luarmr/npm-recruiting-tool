import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
      <header className="mb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
          <span className="text-xs font-semibold tracking-wide text-indigo-400 uppercase">Talent Intelligence Platform</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
          Find World-Class <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Engineers</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
          Source top-tier developer talent by analyzing open source contributions.
          Identify experts in <span className="text-slate-200">React</span>, <span className="text-slate-200">Node.js</span>, <span className="text-slate-200">Rust</span>, and more.
        </p>
      </header>

      <div className="w-full max-w-3xl mb-12 mx-auto">
        <SearchInput onSearch={handleSearch} />
      </div>

      {error && (
        <div className="w-full max-w-3xl p-4 mb-8 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center mx-auto">
          {error}
        </div>
      )}

      <PackageList
        results={results}
        viewMode={viewMode}
      />

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
