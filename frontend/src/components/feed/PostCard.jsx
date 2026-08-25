import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Flag,
  Globe,
  Users,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import { CommentList } from '../comments/CommentList.jsx';
import { formatRelativeTime, formatCompactNumber, parseContentWithLinks } from '../../utils/formatters.jsx';

export function PostCard({ post, onDelete, onPostUpdate }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const canDelete = user && (user.id === post.user_id || isAdmin);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount(prev => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    // Trigger confetti if liked
    if (nextState) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { x, y },
        colors: ['#EC4899', '#7C3AED', '#F472B6'],
        disableForReducedMotion: true,
      });
    }

    try {
      const res = await api.post(`/posts/${post.id}/like`);
      if (res.success && res.data) {
        setIsLiked(res.data.is_liked);
        setLikeCount(res.data.like_count);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(!nextState);
      setLikeCount(prev => (nextState ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    const nextState = !isSaved;
    setIsSaved(nextState);

    try {
      const res = await api.post(`/posts/${post.id}/save`);
      if (res.success && res.data) {
        setIsSaved(res.data.is_saved);
      }
    } catch (err) {
      setIsSaved(!nextState);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Publicación de ${post.author?.full_name} en VYBE`,
          text: post.content.slice(0, 100),
          url,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta publicación permanentemente?')) return;
    try {
      const res = await api.delete(`/posts/${post.id}`);
      if (res.success && onDelete) {
        onDelete(post.id);
      }
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const handleSendReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setIsReporting(true);
    try {
      const res = await api.post('/reports', {
        target_type: 'post',
        target_id: post.id,
        reason: reportReason,
        notes: reportNotes,
      });

      if (res.success) {
        setShowReportModal(false);
        setReportReason('');
        setReportNotes('');
        alert('Gracias por tu reporte. Los moderadores de VYBE lo revisarán a la brevedad.');
      }
    } catch (err) {
      alert(err.message || 'Error enviando reporte');
    } finally {
      setIsReporting(false);
    }
  };

  const handleCommentCountChange = (delta) => {
    setCommentCount(prev => Math.max(0, prev + delta));
  };

  return (
    <>
      <article className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
        {/* Post Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={post.author?.avatar_url}
              name={post.author?.full_name}
              size="md"
              onClick={() => navigate(`/profile/${post.author?.username}`)}
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  onClick={() => navigate(`/profile/${post.author?.username}`)}
                  className="font-bold text-sm sm:text-base text-slate-900 hover:text-purple-600 cursor-pointer transition-colors truncate"
                >
                  {post.author?.full_name}
                </span>

                {post.author?.role === 'admin' && (
                  <Badge variant="purple" size="sm" className="ml-1">
                    Staff
                  </Badge>
                )}

                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400 font-medium">
                  {formatRelativeTime(post.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  @{post.author?.username}
                </span>

                {post.community && (
                  <>
                    <span className="text-slate-300">·</span>
                    <Link
                      to={`/communities/${post.community.slug}`}
                      className="text-xs font-semibold text-purple-600 hover:text-pink-600 flex items-center gap-1 transition-colors"
                    >
                      <span>🏛️ {post.community.name}</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Options Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMenu && (
              <div
                onClick={() => setShowMenu(false)}
                className="absolute right-0 top-8 z-20 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl py-1.5 flex flex-col"
              >
                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar publicación</span>
                  </button>
                )}
                {user && (
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                  >
                    <Flag className="w-4 h-4 text-amber-500" />
                    <span>Reportar contenido</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Text Content */}
        <div className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
          {parseContentWithLinks(
            post.content,
            (tag) => navigate(`/search?q=${encodeURIComponent('#' + tag)}`),
            (mention) => navigate(`/profile/${mention}`)
          )}
        </div>

        {/* Media Image Attachment */}
        {post.image_url && (
          <div
            onClick={() => setSelectedImage(post.image_url)}
            className="mt-3.5 rounded-2xl overflow-hidden border border-slate-200/70 bg-slate-100 cursor-pointer max-h-96 hover:opacity-95 transition-opacity group relative"
          >
            <img
              src={post.image_url}
              alt="Publicación"
              className="w-full h-full object-cover max-h-96"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs bg-white/90 text-slate-800 font-bold px-3 py-1.5 rounded-full shadow">
                Ver imagen completa
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-slate-500">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors group p-1.5 rounded-xl hover:bg-pink-50 ${
              isLiked ? 'text-pink-600' : 'hover:text-pink-600'
            }`}
          >
            <motion.div
              whileTap={{ scale: 1.4 }}
              animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.2 }}
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 ${
                  isLiked ? 'fill-pink-500 text-pink-500' : ''
                }`}
              />
            </motion.div>
            <span>{formatCompactNumber(likeCount)}</span>
          </button>

          {/* Comments Button */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors p-1.5 rounded-xl hover:bg-purple-50 ${
              showComments ? 'text-purple-600' : 'hover:text-purple-600'
            }`}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:scale-110" />
            <span>{formatCompactNumber(commentCount)}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:text-purple-600 transition-colors p-1.5 rounded-xl hover:bg-purple-50 relative"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 text-xs font-bold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:scale-110" />
                <span className="hidden sm:inline">Compartir</span>
              </>
            )}
          </button>

          {/* Save / Bookmark Button */}
          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-colors p-1.5 rounded-xl hover:bg-purple-50 ${
              isSaved ? 'text-purple-600' : 'hover:text-purple-600'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:scale-110 ${
                isSaved ? 'fill-purple-600 text-purple-600' : ''
              }`}
            />
          </button>
        </div>

        {/* Inline Comments Section */}
        {showComments && (
          <CommentList
            postId={post.id}
            onCommentCountChange={handleCommentCountChange}
          />
        )}
      </article>

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Reportar publicación"
      >
        <form onSubmit={handleSendReport} className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Ayúdanos a mantener VYBE seguro. Explícanos por qué deseas reportar esta publicación.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Motivo del reporte *
            </label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">Selecciona un motivo...</option>
              <option value="Spam o contenido repetitivo">Spam o contenido comercial engañoso</option>
              <option value="Acoso o lenguaje ofensivo">Acoso, insultos o violencia verbal</option>
              <option value="Información falsa o suplantación">Desinformación o suplantación de identidad</option>
              <option value="Contenido explícito o no deseado">Contenido explícito inapropiado</option>
              <option value="Infracción de derechos de autor">Violación de derechos de autor</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Detalles adicionales (opcional)
            </label>
            <textarea
              rows={3}
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              placeholder="Añade más contexto si es necesario..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowReportModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isReporting}
              disabled={!reportReason}
            >
              Enviar Reporte
            </Button>
          </div>
        </form>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        maxWidth="max-w-4xl"
      >
        {selectedImage && (
          <div className="flex items-center justify-center p-2">
            <img
              src={selectedImage}
              alt="Zoom"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
          </div>
        )}
      </Modal>
    </>
  );
}
