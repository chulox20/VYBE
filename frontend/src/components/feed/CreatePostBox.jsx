import React, { useState, useRef, useEffect } from 'react';
import { Image, Smile, Globe, Users, Lock, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';

const QUICK_EMOJIS = ['🔥', '🚀', '💻', '🎨', '💡', '🎉', '⚡', '❤️', '👀', '✨'];

export function CreatePostBox({ onPostCreated, defaultCommunityId = null, autoFocus = false }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [communityId, setCommunityId] = useState(defaultCommunityId || '');
  const [communities, setCommunities] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    async function loadUserCommunities() {
      if (!user) return;
      try {
        const res = await api.get('/communities');
        if (res.success && res.data) {
          setCommunities(res.data);
        }
      } catch (err) {
        console.warn('Error loading communities for composer:', err);
      }
    }
    loadUserCommunities();
  }, [user]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede exceder 5MB.');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addEmoji = (emoji) => {
    setContent(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageFile && !imageUrl) {
      setError('Escribe algo o adjunta una imagen para publicar.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await api.uploadFile(imageFile);
      }

      const res = await api.post('/posts', {
        content: content.trim(),
        image_url: finalImageUrl || null,
        visibility,
        community_id: communityId || null,
      });

      if (res.success && res.data) {
        setContent('');
        removeImage();
        setShowEmojiPicker(false);
        if (onPostCreated) {
          onPostCreated(res.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Error al publicar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3.5 items-start">
          <Avatar src={user.avatar_url} name={user.full_name} size="md" />
          <div className="flex-1 flex flex-col min-w-0">
            <textarea
              ref={textareaRef}
              rows={3}
              autoFocus={autoFocus}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="¿Qué estás pensando o creando hoy? Comparte tus ideas..."
              className="w-full bg-transparent border-none p-0 text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 resize-none font-normal leading-relaxed"
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-2 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-72">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Emoji Picker Drawer */}
        {showEmojiPicker && (
          <div className="flex items-center gap-1.5 p-2 bg-purple-50/70 rounded-2xl border border-purple-100 overflow-x-auto">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="text-lg p-1.5 hover:scale-125 transition-transform rounded-xl hover:bg-white"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

        {/* Controls & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            {/* Image input hidden */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar Imagen"
              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Imagen</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Añadir Emoji"
              className="p-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <Smile className="w-4 h-4" />
              <span className="hidden sm:inline">Emoji</span>
            </button>

            {/* Community Selector */}
            {communities.length > 0 && (
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">🌐 En el feed general</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏛️ {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Visibility Selector */}
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="public">Público</option>
              <option value="followers">Solo seguidores</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${content.length > 1800 ? 'text-amber-500' : 'text-slate-400'}`}>
              {content.length}/2000
            </span>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!content.trim() && !imageFile && !imageUrl}
              className="font-bold px-5"
            >
              Publicar
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
