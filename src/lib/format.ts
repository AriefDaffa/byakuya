import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';

export function formatChatTimestamp(dateString: string): string | undefined {
  if (!dateString) return undefined;

  const date = parseISO(dateString);

  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
}

export function formatTime(date: Date | string | number): string {
  return format(new Date(date), 'hh:mm a');
}
