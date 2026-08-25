import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Trash2, CornerDownRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { ReplyBox } from './ReplyBox.jsx';
import { formatRelativeTime, parseContentWithLinks } from '../../utils/formatters.jsx';

export function CommentItem({ comment, onReply, onDelete, depth = 0 }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showReplyBox, setShowReplyBox] = useState(false);

  const canDelete = user && (user.id === comment.user_id || isAdmin);

  const handleReplySubmit = async (content) => {
    await onReply(comment.id, content);
    setShowReplyBox(false);
  };

  return (
    <div className={`flex flex-col gap-2.5 ${depth > 0 ? 'ml-6 sm:ml-8 pl-3 border-l-2 border-slate-200/70' : ''}`}>
      <div className="flex items-start gap-2.5 group">
        <Avatar
          src={comment.author?.avatar_url}
          name={comment.author?.full_name}
          size={depth > 0 ? 'xs' : 'sm'}
          onClick={() => navigate(`/profile/${comment.author?.username}`)}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  onClick={() => navigate(`/profile/${comment.author?.username}`)}
                  className="text-xs sm:text-sm font-bold text-slate-900 hover:text-purple-600 cursor-pointer transition-colors"
                >
                  {comment.author?.full_name}
                </span>
                <span className="text-[11px] text-slate-500">
                  @{comment.author?.username}
                </span>
                <span className="text-[11px] text-slate-400">·</span>
                <span className="text-[11px] text-slate-400">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  title="Eliminar comentario"
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">
              {parseContentWithLinks(
                comment.content,
                (tag) => navigate(`/search?q=${encodeURIComponent('#' + tag)}`),
                (mention) => navigate(`/profile/${mention}`)
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-1 px-2">
            {user && (
              <button
                type="button"
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="text-[11px] font-semibold text-slate-500 hover:text-purple-600 flex items-center gap-1 transition-colors"
              >
                <CornerDownRight className="w-3 h-3" />
                <span>Responder</span>
              </button>
            )}
          </div>

          {/* Reply composer */}
          {showReplyBox && (
            <div className="mt-1">
              <ReplyBox
                onSubmit={handleReplySubmit}
                placeholder={`Respondiendo a @${comment.author?.username}...`}
                onCancel={() => setShowReplyBox(false)}
                autoFocus={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Render child nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
