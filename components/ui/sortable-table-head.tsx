'use client';

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';

interface SortableTableHeadProps<K extends string> {
  label: string;
  sortKey: K;
  activeKey: K | null;
  direction: 'asc' | 'desc';
  onSort: (key: K) => void;
}

// Shared by the vehicles/trips/staff data tables. Declared at module scope
// (not nested inside a page component) because a component defined during
// render loses its state on every re-render.
export function SortableTableHead<K extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: SortableTableHeadProps<K>) {
  const active = activeKey === sortKey;
  return (
    <TableHead className="text-gray-300">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
      >
        {label}
        {active ? (
          direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
        ) : (
          <ArrowUpDown size={14} className="opacity-40" />
        )}
      </button>
    </TableHead>
  );
}
