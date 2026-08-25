import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { PostCard } from '../components/feed/PostCard.jsx';
import { Button } from '../components/ui/Button.jsx';

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPost() {
      try {
        setLoading(true);
        const res = await api.get(`/posts/${id}`);
        if (res.success && res.data) {
          setPost(res.data);
        }
      } catch (err) {
        setError('Publicación no encontrada o eliminada.');
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [id]);

  const handlePostDelete = () => {
    navigate('/feed');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-purple-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-sm font-bold text-slate-700">{error || 'Publicación no disponible'}</p>
        <Button onClick={() => navigate('/feed')} variant="outline" size="sm" className="mt-3">
          Volver al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-600 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a las publicaciones</span>
      </button>

      {/* Post Card */}
      <PostCard post={post} onDelete={handlePostDelete} />
    </div>
  );
}
