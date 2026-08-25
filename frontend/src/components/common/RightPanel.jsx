import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, UserPlus, Sparkles, Check } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';

export function RightPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [trends, setTrends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [followedMap, setFollowedMap] = useState({});

  useEffect(() => {
    async function loadPanelData() {
      try {
        const [trendRes, suggRes] = await Promise.all([
          api.get('/explore/trending'),
          api.get('/users/suggestions?limit=4'),
        ]);

        if (trendRes.success && trendRes.data) {
          setTrends(trendRes.data.slice(0, 5));
        }

        if (suggRes.success && suggRes.data) {
          setSuggestions(suggRes.data);
          const map = {};
          suggRes.data.forEach(u => {
            map[u.username] = u.is_following;
          });
          setFollowedMap(map);
        }
      } catch (err) {
        console.warn('Error loading RightPanel data:', err.message);
      }
    }

    loadPanelData();
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFollowToggle = async (username) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/users/${username}/follow`);
      if (res.success && res.data) {
        setFollowedMap(prev => ({
          ...prev,
          [username]: res.data.is_following,
        }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  return (
    <aside className="sticky top-0 h-screen w-80 xl:w-96 flex flex-col gap-6 p-4 sm:p-6 border-l border-slate-200/80 bg-white/50 backdrop-blur-sm shrink-0 hidden lg:flex overflow-y-auto no-scrollbar z-20">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar usuarios, posts o #tags..."
          className="w-full bg-slate-100/90 border border-slate-200/60 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
        />
      </form>

      {/* Tendencias Widget */}
      <div className="bg-slate-50/80 border border-slate-200/70 rounded-3xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-black text-base">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span>Tendencias en VYBE</span>
          </div>
          <Sparkles className="w-4 h-4 text-pink-500" />
        </div>

        <div className="flex flex-col gap-3">
          {trends.length > 0 ? (
            trends.map((t, idx) => (
              <button
                key={t.tag || idx}
                type="button"
                onClick={() => navigate(`/search?q=${encodeURIComponent('#' + t.tag)}`)}
                className="text-left flex flex-col p-2.5 rounded-2xl hover:bg-white transition-all group border border-transparent hover:border-slate-200/60 hover:shadow-sm"
              >
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t.category || 'Tendencia'}
                </span>
                <span className="text-sm font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                  #{t.tag}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {t.count} publicaciones
                </span>
              </button>
            ))
          ) : (
            <div className="text-xs text-slate-400 py-2 text-center">
              Cargando tendencias...
            </div>
          )}
        </div>
      </div>

      {/* Sugerencias de Usuarios Widget */}
      {suggestions.length > 0 && (
        <div className="bg-slate-50/80 border border-slate-200/70 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-900 font-black text-base">
            <UserPlus className="w-5 h-5 text-pink-500" />
            <span>A quién seguir</span>
          </div>

          <div className="flex flex-col gap-3.5">
            {suggestions.map((sug) => {
              const isFollowing = followedMap[sug.username];
              return (
                <div
                  key={sug.id}
                  className="flex items-center justify-between gap-3 p-1.5 rounded-2xl hover:bg-white transition-all"
                >
                  <div
                    onClick={() => navigate(`/profile/${sug.username}`)}
                    className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                  >
                    <Avatar src={sug.avatar_url} name={sug.full_name} size="md" />
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-bold text-slate-900 hover:text-purple-600 transition-colors truncate">
                        {sug.full_name}
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        @{sug.username}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'primary'}
                    onClick={() => handleFollowToggle(sug.username)}
                    className="font-semibold text-xs px-3 py-1 shrink-0"
                    leftIcon={isFollowing ? <Check className="w-3.5 h-3.5" /> : null}
                  >
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="px-3 text-xs text-slate-400 flex flex-col gap-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#" className="hover:underline">Condiciones</a>
          <a href="#" className="hover:underline">Privacidad</a>
          <a href="#" className="hover:underline">Cookies</a>
          <a href="#" className="hover:underline">Accesibilidad</a>
          <a href="#" className="hover:underline">Normas</a>
        </div>
        <p className="font-medium text-slate-400">© 2026 VYBE Social Inc. Todos los derechos reservados.</p>
      </div>
    </aside>
  );
}
