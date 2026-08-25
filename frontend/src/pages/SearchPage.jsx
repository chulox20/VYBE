import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Users, FileText, Globe, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { PostCard } from '../components/feed/PostCard.jsx';
import { CommunityCard } from '../components/communities/CommunityCard.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({ users: [], posts: [], communities: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (!queryParam.trim()) return;

    let isMounted = true;
    async function executeSearch() {
      setLoading(true);
      try {
        const res = await api.get(`/explore/search?q=${encodeURIComponent(queryParam.trim())}`);
        if (isMounted && res.success && res.data) {
          setResults(res.data);
        }
      } catch (err) {
        console.error('Error in search:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    executeSearch();
    return () => {
      isMounted = false;
    };
  }, [queryParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const totalResults =
    (results.users?.length || 0) +
    (results.posts?.length || 0) +
    (results.communities?.length || 0);

  const tabs = [
    { id: 'all', label: 'Todo', count: totalResults },
    { id: 'users', label: 'Usuarios', count: results.users?.length || 0, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'posts', label: 'Publicaciones', count: results.posts?.length || 0, icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'communities', label: 'Comunidades', count: results.communities?.length || 0, icon: <Globe className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Search Header */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-sm sticky top-0 md:top-4 z-20 flex flex-col gap-4">
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por usuario, palabra clave o #hashtag..."
            className="w-full bg-slate-100 border border-slate-200/80 rounded-2xl pl-10 pr-24 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs px-3.5 py-1.5"
          >
            Buscar
          </Button>
        </form>

        {queryParam && (
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        )}
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-purple-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : !queryParam.trim() ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
          Escribe un término para buscar personas, publicaciones o comunidades en VYBE.
        </div>
      ) : totalResults === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
          No se encontraron resultados para &ldquo;{queryParam}&rdquo;.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Users Section */}
          {(activeTab === 'all' || activeTab === 'users') && results.users?.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-extrabold text-sm text-slate-900 px-1">Usuarios</h3>
              <div className="bg-white border border-slate-200/80 rounded-3xl p-3 shadow-sm divide-y divide-slate-100">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => navigate(`/profile/${u.username}`)}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar_url} name={u.full_name} size="md" />
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-bold text-slate-900 hover:text-purple-600 truncate">
                          {u.full_name}
                        </span>
                        <span className="text-xs text-slate-500">@{u.username}</span>
                        {u.bio && (
                          <p className="text-xs text-slate-600 truncate mt-0.5 max-w-sm">
                            {u.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs shrink-0">
                      Ver perfil
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Communities Section */}
          {(activeTab === 'all' || activeTab === 'communities') && results.communities?.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-extrabold text-sm text-slate-900 px-1">Comunidades</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.communities.map((c) => (
                  <CommunityCard key={c.id} community={c} />
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-extrabold text-sm text-slate-900 px-1">Publicaciones</h3>
              <div className="flex flex-col gap-4">
                {results.posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
