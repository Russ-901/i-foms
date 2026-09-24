const STYLES: Record<string, string> = {
  active: 'bg-green-500/15 text-green-400 border-green-500/30',
  maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.inactive;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${style}`}>
      {status || 'active'}
    </span>
  );
}
