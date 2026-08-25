import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { PostCard } from '../components/feed/PostCard.jsx';
import { FeedSkeleton } from '../components/feed/FeedSkeleton.jsx';

export function SavedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedPosts() {
      try {
        setLoading(true);
        const res = await api.get('/posts/saved');
        if (res.success && res.data) {
          setPosts(res.data);
        }
      } catch (err) {
        console.error('Error loading saved posts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSavedPosts();
  }, []);

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-sm sticky top-0 md:top-4 z-20 flex items-center gap-2.5">
        <div className="p-2 rounded-2xl bg-purple-100 text-purple-600">
          <Bookmark className="w-5 h-5 fill-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Publicaciones Guardadas</h1>
          <p className="text-xs text-slate-500">Tus marcadores y publicaciones favoritas para leer más tarde</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm flex flex-col items-center gap-2">
          <Bookmark className="w-8 h-8 text-slate-300 stroke-[1.5]" />
          <span>No tienes publicaciones guardadas todavía.</span>
          <p className="text-[11px] text-slate-400">
            Haz clic en el icono de marcador en cualquier publicación para guardarla aquí.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onDelete={handlePostDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
