import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, FileText, Info, Check, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { PostCard } from '../components/feed/PostCard.jsx';
import { CreatePostBox } from '../components/feed/CreatePostBox.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { formatCompactNumber, formatRelativeTime } from '../utils/formatters.jsx';

export function CommunityDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    async function loadCommunity() {
      try {
        setLoading(true);
        const [commRes, postsRes, membersRes] = await Promise.all([
          api.get(`/communities/${slug}`),
          api.get(`/communities/${slug}/posts`),
          api.get(`/communities/${slug}/members`),
        ]);

        if (commRes.success && commRes.data) {
          setCommunity(commRes.data);
          setIsJoined(commRes.data.is_member);
          setMemberCount(commRes.data.member_count || 1);
        }

        if (postsRes.success && postsRes.data) {
          setPosts(postsRes.data);
        }

        if (membersRes.success && membersRes.data) {
          setMembers(membersRes.data);
        }
      } catch (err) {
        console.error('Error loading community details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCommunity();
  }, [slug]);

  const handleToggleJoin = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setJoinLoading(true);
    try {
      const res = await api.post(`/communities/${slug}/join`);
      if (res.success && res.data) {
        setIsJoined(res.data.is_member);
        setMemberCount(res.data.member_count);
      }
    } catch (err) {
      alert(err.message || 'Error en la acción de comunidad');
    } finally {
      setJoinLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const tabs = [
    { id: 'posts', label: 'Publicaciones', count: posts.length, icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'members', label: 'Miembros', count: memberCount, icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'about', label: 'Acerca de', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-purple-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-base font-bold text-slate-700">Comunidad no encontrada</p>
        <Button onClick={() => navigate('/communities')} variant="outline" size="sm" className="mt-3">
          Volver a Comunidades
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/communities')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-600 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Comunidades</span>
      </button>

      {/* Community Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-40 sm:h-48 w-full bg-gradient-to-r from-purple-600 to-pink-500 relative">
          {community.cover_url && (
            <img src={community.cover_url} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="p-5 sm:p-6 -mt-10 relative flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden shrink-0">
              <img
                src={community.image_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80'}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            </div>

            <Button
              variant={isJoined ? 'secondary' : 'primary'}
              size="md"
              isLoading={joinLoading}
              onClick={handleToggleJoin}
              leftIcon={isJoined ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              className="font-bold px-5"
            >
              {isJoined ? 'Unido' : 'Unirse'}
            </Button>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{community.name}</h1>
              <Badge variant="purple" size="sm">
                {community.category || 'Tecnología'}
              </Badge>
            </div>
            <span className="text-xs text-slate-400 font-semibold block mt-0.5">
              c/{community.slug}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {community.description || 'Espacio oficial de la comunidad para compartir ideas y debatir.'}
          </p>

          <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>{formatCompactNumber(memberCount)} miembros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-pink-500" />
              <span>{posts.length} publicaciones</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab: Posts */}
      {activeTab === 'posts' && (
        <div className="flex flex-col gap-4">
          {user && (
            <CreatePostBox
              defaultCommunityId={community.id}
              onPostCreated={handlePostCreated}
            />
          )}

          {posts.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
              No hay publicaciones en esta comunidad todavía. ¡Sé el primero en compartir!
            </div>
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {/* Tab: Members */}
      {activeTab === 'members' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm divide-y divide-slate-100">
          {members.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/profile/${m.username}`)}
              className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={m.avatar_url} name={m.full_name} size="md" />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold text-slate-900 truncate hover:text-purple-600">
                    {m.full_name}
                  </span>
                  <span className="text-xs text-slate-500">@{m.username}</span>
                </div>
              </div>

              <Badge
                variant={m.role === 'owner' ? 'purple' : m.role === 'moderator' ? 'pink' : 'slate'}
                size="sm"
              >
                {m.role}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Tab: About */}
      {activeTab === 'about' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="font-extrabold text-base text-slate-900">Acerca de {community.name}</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {community.description || 'Sin descripción detallada.'}
          </p>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
            <div>
              <span className="font-bold text-slate-700">Creada por:</span>{' '}
              <span className="text-purple-600 font-semibold cursor-pointer" onClick={() => navigate(`/profile/${community.owner?.username}`)}>
                {community.owner?.full_name} (@{community.owner?.username})
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Fecha de creación:</span>{' '}
              {formatRelativeTime(community.created_at)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
