interface BadgeNotifProps {
  count: number;
}

export function BadgeNotif({ count }: BadgeNotifProps) {
  return (
    <div className="bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
      {count}
    </div>
  );
}
