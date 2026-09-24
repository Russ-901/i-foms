'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHue } from '@/context/HueContext';
import gsap from 'gsap';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from '@/components/ui/select';
import { Search, Copy, Check } from 'lucide-react';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Staff } from '@/types/models';
import { toast } from 'sonner';
import InviteEmailStatus from '@/components/staff/InviteEmailStatus';

type SortKey = 'name' | 'email' | 'department' | 'position';
const PAGE_SIZE = 8;

export default function StaffPage() {
    const hue = useHue();
    const router = useRouter();
    const titleRef = useRef<HTMLHeadingElement>(null);
    const [staffs, setStaffs] = useState<Staff[]>([]);
    const [addOpen, setAddOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
    });

    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);

    // Invite dialog, shown right after a new staff member is created.
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteUrl, setInviteUrl] = useState('');
    const [inviteEmailSent, setInviteEmailSent] = useState(false);
    const [copied, setCopied] = useState(false);

    const departments = ['Administration', 'Fuel Management', 'Transportation', 'Mechanics'];

    const positionsByDept: Record<string, string[]> = {
        Administration: ['HR', 'Finance', 'Supervisor'],
        'Fuel Management': ['Fuel Supervisor', 'Fuel Operator'],
        Transportation: ['Driver', 'Senior Driver'],
        Mechanics: ['Mechanic', 'Senior Mechanic'],
    };

    async function fetchStaffs() {
        const res = await fetch('/api/staff');
        setStaffs(await res.json());
    }

    useEffect(() => {
        if (titleRef.current)
        gsap.fromTo(titleRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
        fetchStaffs();
    }, []);

    const filteredPositions = form.department ? positionsByDept[form.department] : [];

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        try {
            const res = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const staff = await res.json();

            if (!res.ok) {
                toast.error(staff.message || 'Failed to add staff member.');
                return;
            }

            fetchStaffs();
            setForm({ name: '', email: '', phone: '', department: '', position: '' });
            setAddOpen(false);

            // Immediately generate an invite so the admin never has to set a
            // password on someone else's behalf.
            const inviteRes = await fetch(`/api/staff/${staff._id}/invite`, { method: 'POST' });
            const invite = await inviteRes.json();

            if (inviteRes.ok) {
                setInviteUrl(invite.inviteUrl);
                setInviteEmailSent(invite.emailSent);
                setCopied(false);
                setInviteOpen(true);
                toast.success('Staff member added.');
            } else {
                toast.warning('Staff member added, but the invite link could not be generated.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    async function copyInviteLink() {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            toast.success('Invite link copied.');
        } catch {
            toast.error('Could not copy — select and copy the link manually.');
        }
    }

    function toggleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
        setPage(1);
    }

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return staffs;
        return staffs.filter((s) =>
            [s.name, s.email, s.phone, s.department, s.position]
                .filter(Boolean)
                .some((field) => field.toLowerCase().includes(q))
        );
    }, [staffs, search]);

    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        const copy = [...filtered];
        copy.sort((a, b) => {
            const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''));
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return copy;
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
            <h1
                ref={titleRef}
                className="text-2xl uppercase font-bold"
                style={{ color: `hsl(${hue},70%,60%)` }}
            >
                Staff Management
            </h1>

            {/* Add Staff Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                <Button
                    className="text-white hover:opacity-90"
                    style={{ backgroundColor: `hsl(${hue},70%,50%)` }}
                >
                    + New Staff
                </Button>
                </DialogTrigger>

                <DialogContent
                className="bg-gray-900 border text-white w-md h-[500px] overflow-y-auto"
                style={{ borderColor: `hsl(${hue},70%,20%)` }}
                >
                <DialogHeader className="mb-4">
                    <DialogTitle
                    className="uppercase"
                    style={{ color: `hsl(${hue},70%,60%)` }}
                    >
                    Add New Staff
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                    className="w-full bg-gray-800 border-gray-700 text-white"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Fullname"
                    required
                    />
                    <Input
                    type="email"
                    className="w-full bg-gray-800 border-gray-700 text-white"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Email"
                    required
                    />
                    <Input
                    className="w-full bg-gray-800 border-gray-700 text-white"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Phone"
                    required
                    />

                    {/* Department Selection */}
                    <Select
                    onValueChange={(v) => setForm({ ...form, department: v, position: '' })}
                    value={form.department}
                    >
                    <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                        {departments.map((d) => (
                        <SelectItem key={d} value={d}>
                            {d}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>

                    {/* Position Selection (Filtered) */}
                    {form.department && (
                    <Select
                        onValueChange={(v) => setForm({ ...form, position: v })}
                        value={form.position}
                    >
                        <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select Position" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                        {filteredPositions.map((p) => (
                            <SelectItem key={p} value={p}>
                            {p}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    )}

                    <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-4 text-white font-semibold hover:opacity-90"
                    style={{
                        background: `linear-gradient(90deg, hsl(${hue},70%,45%), hsl(${(hue + 30) % 360},100%,18%))`,
                    }}
                    >
                    {submitting ? 'Saving...' : 'Save Staff'}
                    </Button>
                </form>
                </DialogContent>
            </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
                placeholder="Search by name, email, department..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="bg-gray-800 border-gray-700 pl-9"
            />
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto border border-gray-800 rounded-lg">
            <Table>
            <TableHeader>
                <TableRow className="bg-gray-800">
                    <SortableTableHead label="Name" sortKey="name" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                    <SortableTableHead label="Email" sortKey="email" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                    <TableHead className="text-gray-300">Phone</TableHead>
                    <SortableTableHead label="Department" sortKey="department" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                    <SortableTableHead label="Position" sortKey="position" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                </TableRow>
            </TableHeader>
            <TableBody>
                {paged.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                            No staff found.
                        </TableCell>
                    </TableRow>
                )}
                {paged.map((s, i) => (
                <TableRow
                    key={s._id}
                    onClick={() => router.push(`/dashboard/staff/${s._id}`)}
                    className="cursor-pointer hover:bg-gray-800/60 transition-colors"
                    style={{
                    animation: `fadeIn 0.5s ease ${i * 0.05}s both`,
                    }}
                >
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell>{s.position}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Page {page} of {totalPages} ({sorted.length} staff)</span>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </Button>
                </div>
            </div>
        )}

        {/* Invite link dialog */}
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogContent
                className="bg-gray-900 border text-white"
                style={{ borderColor: `hsl(${hue},70%,20%)` }}
            >
                <DialogHeader>
                    <DialogTitle className="uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
                        Invite Created
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <InviteEmailStatus emailSent={inviteEmailSent} />
                    {/* Only needed as a manual fallback when the email didn't go out. */}
                    {!inviteEmailSent && (
                        <div className="flex gap-2">
                            <Input readOnly value={inviteUrl} className="bg-gray-800 border-gray-700 text-xs" />
                            <Button type="button" variant="outline" onClick={copyInviteLink} className="shrink-0">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </Button>
                        </div>
                    )}
                    <p className="text-xs text-gray-500">This link expires in 7 days.</p>
                </div>
            </DialogContent>
        </Dialog>

        <style jsx global>{`
            @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
            }
        `}</style>
        </div>
    );
}
