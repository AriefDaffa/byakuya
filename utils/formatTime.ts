import { format } from 'date-fns';

export function formatTime(date: Date | string | number): string {
  return format(new Date(date), 'hh:mm a');
}
