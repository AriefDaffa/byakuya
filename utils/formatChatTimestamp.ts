import {
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns';

export function formatChatTimestamp(dateString: string) {
  if (dateString === '') {
    return;
  }

  const date = parseISO(dateString);

  if (isToday(date)) {
    return format(date, 'h:mm a');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
}
