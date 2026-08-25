import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Check, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { formatCompactNumber } from '../../utils/formatters.jsx';

export function CommunityCard({ community, isJoined = false, onJoinChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(isJoined);
  const [memberCount, setMemberCount] = useState(community.member_count || 1);
  const [loading, setLoading] = useState(false);

  const handleToggleJoin = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/communities/${community.slug}/join`);
      if (res.success && res.data) {
        setJoined(res.data.is_member);
        setMemberCount(res.data.member_count);
        if (onJoinChange) {
          onJoinChange(community.id, res.data.is_member);
        }
      }
    } catch (err) {
      alert(err.message || 'Error uniéndose a la comunidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/communities/${community.slug}`)}
      className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col group"
    >
      {/* Cover */}
      <div className="h-28 w-full bg-gradient-to-r from-purple-600 to-pink-500 relative overflow-hidden">
        {community.cover_url && (
          <img
            src={community.cover_url}
            alt={community.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between -mt-8 relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden shrink-0">
            <img
              src={community.image_url || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&auto=format&fit=crop&q=80'}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>

          <Badge variant="purple" size="sm">
            {community.category || 'Tecnología'}
          </Badge>
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-purple-600 transition-colors">
            {community.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {community.description || 'Comunidad para debatir ideas y compartir contenido sobre este tema.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Users className="w-4 h-4 text-purple-600" />
            <span>{formatCompactNumber(memberCount)} miembros</span>
          </div>

          <Button
            size="sm"
            variant={joined ? 'secondary' : 'primary'}
            isLoading={loading}
            onClick={handleToggleJoin}
            leftIcon={joined ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            className="text-xs font-bold px-3 py-1"
          >
            {joined ? 'Unido' : 'Unirse'}
          </Button>
        </div>
      </div>
    </div>
  );
}
