import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Users, TrendingUp, RefreshCw, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';
import { CreatePostBox } from '../components/feed/CreatePostBox.jsx';
import { PostCard } from '../components/feed/PostCard.jsx';
import { FeedSkeleton } from '../components/feed/FeedSkeleton.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Button } from '../components/ui/Button.jsx';

export function FeedPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('for_you');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const tabs = [
    { id: 'for_you', label: 'Para ti', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'following', label: 'Siguiendo', icon: <Users className="w-4 h-4" /> },
    { id: 'popular', label: 'Populares', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const fetchFeed = useCallback(async (isInitial = true, cursor = null) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const queryParams = new URLSearchParams({
        tab: activeTab,
        limit: '15',
        ...(cursor ? { cursor } : {}),
      });

      const res = await api.get(`/posts/feed?${queryParams.toString()}`);
      if (res.success && res.data) {
        if (isInitial) {
          setPosts(res.data.posts || []);
        } else {
          setPosts(prev => [...prev, ...(res.data.posts || [])]);
        }
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Top Header & Feed Tabs */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm sticky top-0 md:top-4 z-20">
        <div className="px-5 pt-4 pb-1">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Inicio
          </h1>
        </div>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => {
            setActiveTab(tabId);
            setNextCursor(null);
          }}
        />
      </div>

      {/* Post Composer Box */}
      {user && (
        <CreatePostBox onPostCreated={handlePostCreated} />
      )}

      {/* Feed Stream */}
      {loading ? (
        <FeedSkeleton count={4} />
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center flex flex-col items-center gap-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {activeTab === 'following'
              ? 'Todavía no sigues a nadie o no han publicado.'
              : 'No hay publicaciones para mostrar.'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {activeTab === 'following'
              ? 'Explora las sugerencias de la barra lateral o busca creadores de contenido para ver sus publicaciones aquí.'
              : '¡Sé el primero en compartir algo interesante con la comunidad de VYBE!'}
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => fetchFeed(true)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="mt-2 text-xs"
          >
            Actualizar feed
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handlePostDelete}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-2 pb-6">
              <Button
                variant="outline"
                size="md"
                isLoading={loadingMore}
                onClick={() => fetchFeed(false, nextCursor)}
                className="font-bold border-slate-300 px-6"
              >
                Cargar más publicaciones
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
