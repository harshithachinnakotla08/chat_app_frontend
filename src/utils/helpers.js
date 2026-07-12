/**
 * Format a timestamp into a readable time string
 */
export function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

/**
 * Format timestamp for message bubble (just time)
 */
export function formatMessageTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get message status text/symbol
 */
export function getMessageStatus(message, currentUserId) {
  if (message.sender?._id !== currentUserId && message.sender !== currentUserId) {
    return null; // Not our message
  }
  if (message.read) return 'read';
  if (message.delivered) return 'delivered';
  return 'sent';
}

/**
 * Truncate text for previews
 */
export function truncate(text, maxLength = 40) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}