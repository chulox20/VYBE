import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, Sparkles, Search, Check, Plus } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PostCard } from '../components/feed/PostCard.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Button } from '../components/ui/Button.jsx';
import { FeedSkeleton } from '../components/feed/FeedSkeleton.jsx';

export function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trends, setTrends] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followedMap, setFollowedMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExploreData() {
      try {
        setLoading(true);
        const [trendRes, postsRes, usersRes] = await Promise.all([
          api.get('/explore/trending'),
          api.get('/explore/popular'),
          api.get('/users/suggestions?limit=6'),
        ]);

        if (trendRes.success && trendRes.data) setTrends(trendRes.data);
        if (postsRes.success && postsRes.data) setPopularPosts(postsRes.data);
        if (usersRes.success && usersRes.data) {
          setSuggestedUsers(usersRes.data);
          const map = {};
          usersRes.data.forEach(u => {
            map[u.username] = u.is_following;
          });
          setFollowedMap(map);
        }
      } catch (err) {
        console.error('Error loading explore data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadExploreData();
  }, [user]);

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
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-sm sticky top-0 md:top-4 z-20 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Explorar</h1>
          <p className="text-xs text-slate-500">Descubre lo más destacado y relevante de la comunidad</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/search')}
          leftIcon={<Search className="w-4 h-4" />}
          className="text-xs"
        >
          Buscar
        </Button>
      </div>

      {/* Trending Topics Grid */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 text-slate-900 font-black text-base">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <span>Temas en Tendencia</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {trends.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => navigate(`/search?q=${encodeURIComponent('#' + t.tag)}`)}
              className="text-left p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 transition-all border border-slate-100 hover:border-purple-200 flex flex-col group"
            >
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {t.category || 'Tendencia'}
              </span>
              <span className="text-sm font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
                #{t.tag}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                {t.count} posts
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested People Grid */}
      {suggestedUsers.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-900 font-black text-base">
            <Users className="w-5 h-5 text-pink-500" />
            <span>Creadores recomendados</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestedUsers.map((sug) => {
              const isFollowing = followedMap[sug.username];
              return (
                <div
                  key={sug.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                >
                  <div
                    onClick={() => navigate(`/profile/${sug.username}`)}
                    className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                  >
                    <Avatar src={sug.avatar_url} name={sug.full_name} size="md" />
                    <div className="flex flex-col truncate">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate hover:text-purple-600">
                        {sug.full_name}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate">
                        @{sug.username}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'primary'}
                    onClick={() => handleFollowToggle(sug.username)}
                    className="text-xs px-3 py-1 shrink-0 font-bold"
                    leftIcon={isFollowing ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  >
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Posts Stream */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-black text-slate-900">Publicaciones Populares</h2>
        </div>

        {loading ? (
          <FeedSkeleton count={3} />
        ) : popularPosts.length === 0 ? (
          <div className="bg-white p-8 text-center text-slate-400 rounded-3xl text-xs">
            No hay publicaciones populares en este momento.
          </div>
        ) : (
          popularPosts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  );
}
