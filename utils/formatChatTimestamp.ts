import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';

export function formatChatTimestamp(dateString: string) {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return format(date, 'h:mm a'); // Show time if today
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
}
