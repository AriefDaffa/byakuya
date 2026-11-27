import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  isValid,
  parseISO,
} from 'date-fns';

function parseDateString(dateInput: string | Date): Date | null {
  if (!dateInput) return null;

  const date = dateInput instanceof Date ? dateInput : parseISO(dateInput);
  return isValid(date) ? date : null;
}

export function formatChatTimestamp(dateString: string | Date): string | undefined {
  const date = parseDateString(dateString);
  if (!date) return undefined;

  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
}

/** Timestamp shown next to a conversation in the chat list. */
export function formatChatListTime(dateString: string | Date): string | undefined {
  return formatChatTimestamp(dateString);
}

/** Calendar label used for message date separators. */
export function formatMessageDate(dateString: string | Date): string | undefined {
  const date = parseDateString(dateString);
  if (!date) return undefined;

  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';

  return format(date, 'MMM d, yyyy');
}

export function formatTime(date: Date | string | number): string {
  const parsed = date instanceof Date ? date : new Date(date);
  if (!isValid(parsed)) return '';

  return format(parsed, 'hh:mm a');
}
