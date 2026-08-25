import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api.js';
import { CommentItem } from './CommentItem.jsx';
import { ReplyBox } from './ReplyBox.jsx';

export function CommentList({ postId, onCommentCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/comments/post/${postId}`);
      if (res.success && res.data) {
        setComments(res.data);
      }
    } catch (err) {
      setError('Error cargando comentarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleCreateComment = async (content, parentCommentId = null) => {
    try {
      const res = await api.post(`/comments/post/${postId}`, {
        content,
        parent_comment_id: parentCommentId,
      });

      if (res.success) {
        // Reload comments tree
        await loadComments();
        if (onCommentCountChange) {
          onCommentCountChange(1);
        }
      }
    } catch (err) {
      console.error('Error creating comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;
    try {
      const res = await api.delete(`/comments/${commentId}`);
      if (res.success) {
        await loadComments();
        if (onCommentCountChange) {
          onCommentCountChange(-1);
        }
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-3 border-t border-slate-100 mt-2">
      {/* Top level add comment */}
      <ReplyBox
        onSubmit={(content) => handleCreateComment(content, null)}
        placeholder="Añade un comentario a esta publicación..."
      />

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-6 text-purple-600">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-500 text-center py-2">{error}</p>
      ) : comments.length === 0 ? (
        <div className="text-center py-5 text-slate-400 text-xs flex flex-col items-center gap-1">
          <MessageCircle className="w-6 h-6 stroke-[1.5]" />
          <span>Sé el primero en comentar esta publicación.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 mt-2">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={(parentId, text) => handleCreateComment(text, parentId)}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
