import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';

export function ReplyBox({ onSubmit, placeholder = 'Escribe una respuesta...', onCancel = null, autoFocus = false }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2.5 mt-2">
      <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 bg-slate-100/80 rounded-2xl px-3 py-2 border border-slate-200 focus-within:border-purple-500 focus-within:bg-white transition-all">
          <input
            type="text"
            autoFocus={autoFocus}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent border-none p-0 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="text-purple-600 hover:text-pink-500 disabled:opacity-40 transition-colors p-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] text-slate-400 hover:text-slate-600 self-start px-2"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
