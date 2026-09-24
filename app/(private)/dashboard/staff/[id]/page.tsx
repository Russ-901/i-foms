'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useHue } from '@/context/HueContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TripStatusBadge from '@/components/trips/TripStatusBadge';
import InviteEmailStatus from '@/components/staff/InviteEmailStatus';
import { StaffDetail } from '@/types/models';

export default function StaffDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hue = useHue();
  const router = useRouter();

  const [data, setData] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [invitePending, setInvitePending] = useState(false);
  const [copied, setCopied] = useState(false);
  // Only reflects the outcome of a Send/Resend Invite clicked on this page —
  // null until then, since we don't otherwise know if a past email attempt
  // succeeded.
  const [lastEmailResult, setLastEmailResult] = useState<boolean | null>(null);

  useEffect(() => {
    loadStaff();
  }, [id]);

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch(`/api/staff/${id}`);
      if (res.status === 404) return setNotFound(true);
      if (res.status === 403) return setForbidden(true);
      if (!res.ok) throw new Error('Failed to load staff');
      setData(await res.json());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load staff details.');
    } finally {
      setLoading(false);
    }
  }

  async function sendInvite() {
    setInvitePending(true);
    try {
      const res = await fetch(`/api/staff/${id}/invite`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.message || 'Failed to send invite.');
        return;
      }
      toast.success(result.emailSent ? 'Invite email sent.' : 'Invite link generated.');
      setLastEmailResult(result.emailSent);
      setCopied(false);
      loadStaff();
    } finally {
      setInvitePending(false);
    }
  }

  async function copyInviteLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Invite link copied.');
    } catch {
      toast.error('Could not copy — select and copy the link manually.');
    }
  }

  if (loading) return <p className="text-gray-500">Loading staff member...</p>;
  if (notFound) return <p className="text-gray-500">Staff member not found.</p>;
  if (forbidden) return <p className="text-gray-500">You don&apos;t have access to this page.</p>;
  if (!data) return null;

  const { staff, account, invite, trips } = data;
  const inviteUrl = invite
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/accept-invite?token=${invite.token}`
    : '';
  const isDriver = ['Driver', 'Senior Driver'].includes(staff.position);

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/dashboard/staff')}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Staff
      </button>

      <div>
        <h1 className="text-2xl font-bold" style={{ color: `hsl(${hue},70%,60%)` }}>
          {staff.name}
        </h1>
        <p className="text-gray-400">{staff.position} · {staff.department}</p>
      </div>

      {/* Basic Info */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase text-gray-300">Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Email</p>
            <p>{staff.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p>{staff.phone}</p>
          </div>
          <div>
            <p className="text-gray-500">Department</p>
            <p>{staff.department}</p>
          </div>
          <div>
            <p className="text-gray-500">Position</p>
            <p>{staff.position}</p>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className="bg-gray-900/60 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm uppercase text-gray-300">Account</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-4">
          {account ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500">Username</p>
                <p>{account.username}</p>
              </div>
              <div>
                <p className="text-gray-500">Role</p>
                <p className="capitalize">{account.role}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p>{account.status}</p>
              </div>
            </div>
          ) : invite ? (
            <div className="space-y-3">
              {lastEmailResult !== null && <InviteEmailStatus emailSent={lastEmailResult} />}
              <p className="text-gray-400">
                Invite pending — expires {new Date(invite.expiresAt).toLocaleDateString()}.
              </p>
              {/* Hidden once we've confirmed the email went out this session;
                  shown whenever that's unconfirmed or failed, as a fallback. */}
              {lastEmailResult !== true && (
                <div className="flex gap-2">
                  <Input readOnly value={inviteUrl} className="bg-gray-800 border-gray-700 text-xs" />
                  <Button type="button" variant="outline" onClick={() => copyInviteLink(inviteUrl)} className="shrink-0">
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                disabled={invitePending}
                onClick={sendInvite}
                className="gap-2"
              >
                <RefreshCw size={14} className={invitePending ? 'animate-spin' : ''} />
                Resend Invite
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400">This staff member doesn&apos;t have an account yet.</p>
              <Button
                disabled={invitePending}
                onClick={sendInvite}
                className="gap-2 hover:opacity-90"
                style={{ backgroundColor: `hsl(${hue},70%,50%)`, color: 'white' }}
              >
                <Mail size={14} />
                {invitePending ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip History (drivers only) */}
      {isDriver && (
        <Card className="bg-gray-900/60 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm uppercase text-gray-300">
              Trip History ({trips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trips.length === 0 ? (
              <p className="text-sm text-gray-500">No trips recorded for this driver yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-800">
                      <TableHead className="text-gray-300">Trip #</TableHead>
                      <TableHead className="text-gray-300">Route</TableHead>
                      <TableHead className="text-gray-300">Vehicle</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((t) => (
                      <TableRow
                        key={t._id}
                        className="cursor-pointer hover:bg-gray-800/60"
                        onClick={() => router.push(`/dashboard/trips/${t._id}`)}
                      >
                        <TableCell>{t.tripNumber}</TableCell>
                        <TableCell>{t.origin} → {t.destination}</TableCell>
                        <TableCell className="uppercase">{t.vehicleId?.plateNumber ?? 'N/A'}</TableCell>
                        <TableCell>{new Date(t.startDate).toLocaleDateString()}</TableCell>
                        <TableCell><TripStatusBadge status={t.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
