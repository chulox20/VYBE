import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, Image, Bookmark, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';
import { ProfileHeader } from '../components/profile/ProfileHeader.jsx';
import { PostCard } from '../components/feed/PostCard.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { FeedSkeleton } from '../components/feed/FeedSkeleton.jsx';
import { formatRelativeTime } from '../utils/formatters.jsx';

export function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [replies, setReplies] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user && user.username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        const [profRes, postsRes, repRes] = await Promise.all([
          api.get(`/users/${username}`),
          api.get(`/users/${username}/posts`),
          api.get(`/users/${username}/replies`),
        ]);

        if (profRes.success && profRes.data) {
          setProfile(profRes.data);
        }
        if (postsRes.success && postsRes.data) {
          setPosts(postsRes.data);
        }
        if (repRes.success && repRes.data) {
          setReplies(repRes.data);
        }

        if (isOwnProfile) {
          const savedRes = await api.get('/posts/saved');
          if (savedRes.success && savedRes.data) {
            setSavedPosts(savedRes.data);
          }
        }
      } catch (err) {
        console.error('Error loading profile page:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [username, isOwnProfile]);

  const handleProfileUpdated = (updated) => {
    setProfile(prev => ({ ...prev, ...updated }));
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const mediaPosts = posts.filter(p => p.image_url);

  const tabs = [
    { id: 'posts', label: 'Publicaciones', count: posts.length, icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'replies', label: 'Respuestas', count: replies.length, icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'media', label: 'Multimedia', count: mediaPosts.length, icon: <Image className="w-3.5 h-3.5" /> },
  ];

  if (isOwnProfile) {
    tabs.push({ id: 'saved', label: 'Guardados', count: savedPosts.length, icon: <Bookmark className="w-3.5 h-3.5" /> });
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-purple-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-base font-bold text-slate-700">Usuario no encontrado</p>
        <button
          onClick={() => navigate('/feed')}
          className="mt-3 text-xs text-purple-600 font-bold hover:underline"
        >
          Volver al Inicio
        </button>
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
        <span>Volver</span>
      </button>

      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        onProfileUpdate={handleProfileUpdated}
      />

      {/* Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab: Posts */}
      {activeTab === 'posts' && (
        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
              @{profile.username} aún no ha compartido ninguna publicación.
            </div>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} onDelete={handlePostDelete} />)
          )}
        </div>
      )}

      {/* Tab: Replies */}
      {activeTab === 'replies' && (
        <div className="flex flex-col gap-3">
          {replies.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
              No hay respuestas recientes.
            </div>
          ) : (
            replies.map((rep) => (
              <div
                key={rep.id}
                onClick={() => rep.post && navigate(`/post/${rep.post.id}`)}
                className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-purple-600">
                    Comentó en una publicación
                  </span>
                  <span>{formatRelativeTime(rep.created_at)}</span>
                </div>
                <p className="text-sm text-slate-800 font-medium whitespace-pre-wrap">
                  {rep.content}
                </p>
                {rep.post && (
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-slate-500 line-clamp-2">
                    <span className="font-bold text-slate-700">Publicación original:</span> {rep.post.content}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Media */}
      {activeTab === 'media' && (
        <div className="flex flex-col gap-4">
          {mediaPosts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
              No hay fotos o contenido multimedia compartido.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {mediaPosts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/post/${p.id}`)}
                  className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group relative h-48 sm:h-56"
                >
                  <img
                    src={p.image_url}
                    alt="Media"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                    <p className="text-xs text-white line-clamp-2 font-medium">
                      {p.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Saved */}
      {activeTab === 'saved' && isOwnProfile && (
        <div className="flex flex-col gap-4">
          {savedPosts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
              No tienes publicaciones guardadas.
            </div>
          ) : (
            savedPosts.map((p) => <PostCard key={p.id} post={p} onDelete={handlePostDelete} />)
          )}
        </div>
      )}
    </div>
  );
}
