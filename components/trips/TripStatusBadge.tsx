const STYLES: Record<string, string> = {
  Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Approved: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Ongoing: 'bg-green-500/15 text-green-400 border-green-500/30',
  Completed: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  Cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
  Declined: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function TripStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.Completed;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}
