export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'hace un momento';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} min`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours} h`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `hace ${diffInDays} d`;
  }
  
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function formatCompactNumber(number) {
  if (number === null || number === undefined) return '0';
  const num = Number(number);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export function parseContentWithLinks(content, onTagClick, onMentionClick) {
  if (!content) return [];
  
  // Split tokens by space preserving words
  const words = content.split(/(\s+)/);
  
  return words.map((word, index) => {
    if (word.startsWith('#') && word.length > 1) {
      const tag = word.slice(1).replace(/[^\w\u00C0-\u017F]/g, '');
      const trailing = word.slice(tag.length + 1);
      return (
        <span key={index}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onTagClick) onTagClick(tag);
            }}
            className="text-purple-600 font-semibold hover:text-pink-600 hover:underline transition-colors"
          >
            #{tag}
          </button>
          {trailing}
        </span>
      );
    }

    if (word.startsWith('@') && word.length > 1) {
      const mention = word.slice(1).replace(/[^\w.]/g, '');
      const trailing = word.slice(mention.length + 1);
      return (
        <span key={index}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onMentionClick) onMentionClick(mention);
            }}
            className="text-pink-600 font-semibold hover:text-purple-600 hover:underline transition-colors"
          >
            @{mention}
          </button>
          {trailing}
        </span>
      );
    }

    return word;
  });
}
