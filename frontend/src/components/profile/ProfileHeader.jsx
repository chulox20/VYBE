import React, { useState } from 'react';
import { MapPin, Link as LinkIcon, Calendar, Check, UserPlus, Edit3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { EditProfileModal } from './EditProfileModal.jsx';
import { formatCompactNumber } from '../../utils/formatters.jsx';

export function ProfileHeader({ profile, isOwnProfile, onProfileUpdate }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(profile.is_following || false);
  const [followerCount, setFollowerCount] = useState(profile.follower_count || 0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (!user) return;
    setIsFollowLoading(true);
    try {
      const res = await api.post(`/users/${profile.username}/follow`);
      if (res.success && res.data) {
        setIsFollowing(res.data.is_following);
        setFollowerCount(res.data.follower_count);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const memberDate = profile.member_since
    ? new Date(profile.member_since).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : '2026';

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
      {/* Cover Banner */}
      <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-purple-600 via-purple-700 to-pink-500 relative">
        {profile.cover_url && (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="w-full h-full object-cover opacity-90"
          />
        )}
      </div>

      {/* Profile Details Container */}
      <div className="px-5 sm:px-8 pb-6 relative">
        {/* Avatar and Action Button */}
        <div className="flex justify-between items-end -mt-14 sm:-mt-16 mb-4">
          <div className="ring-4 ring-white rounded-full bg-white shadow-md">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              size="2xl"
              className="w-24 h-24 sm:w-32 sm:h-32"
            />
          </div>

          <div className="flex items-center gap-2 mb-1">
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsEditOpen(true)}
                leftIcon={<Edit3 className="w-4 h-4" />}
                className="font-bold border-slate-300"
              >
                Editar perfil
              </Button>
            ) : (
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="md"
                isLoading={isFollowLoading}
                onClick={handleFollowToggle}
                leftIcon={isFollowing ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                className="font-bold px-6"
              >
                {isFollowing ? 'Siguiendo' : 'Seguir'}
              </Button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {profile.full_name}
              </h1>
              {profile.role === 'admin' && (
                <Badge variant="purple" size="sm" className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Staff VYBE
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500">
              @{profile.username}
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm sm:text-base text-slate-800 leading-relaxed max-w-2xl whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Meta Info (Location, Website, Date) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-500 font-medium pt-1">
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-slate-400" />
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-pink-600 hover:underline font-semibold"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Se unió en {memberDate}</span>
            </div>
          </div>

          {/* Followers & Following Stats */}
          <div className="flex items-center gap-6 pt-3 border-t border-slate-100 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900">
                {formatCompactNumber(profile.following_count || 0)}
              </span>
              <span className="text-slate-500 font-medium">siguiendo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900">
                {formatCompactNumber(followerCount)}
              </span>
              <span className="text-slate-500 font-medium">seguidores</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900">
                {formatCompactNumber(profile.post_count || 0)}
              </span>
              <span className="text-slate-500 font-medium">publicaciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          profile={profile}
          onUpdated={onProfileUpdate}
        />
      )}
    </div>
  );
}
