'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useHue } from '@/context/HueContext';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface InviteInfo {
  name: string;
  email: string;
  department: string;
  position: string;
}

function AcceptInviteForm() {
  const hue = useHue();
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  // A missing token is known synchronously from the URL, so these start in
  // their final state for that case instead of being set from inside the
  // effect below (which only needs to run the actual async check).
  const [loading, setLoading] = useState(!!token);
  const [invalid, setInvalid] = useState(!token);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/invite/${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        setInvite(await res.json());
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to set up account');

      toast.success('Account created! You can now sign in.');
      router.push('/auth/signin');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set up account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center text-white relative overflow-hidden transition-colors duration-500 p-4"
      style={{
        background: `linear-gradient(135deg, hsl(${hue},30%,8%) 0%, hsl(${(hue + 40) % 360},25%,10%) 100%)`,
      }}
    >
      <Card
        className="w-full max-w-md bg-gray-900/70 backdrop-blur-lg border-gray-800 shadow-2xl rounded-sm z-10"
        style={{ borderColor: `hsl(${hue},70%,40%)` }}
      >
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
            Set Up Your Account
          </CardTitle>
          {invite && (
            <CardDescription className="text-gray-400">
              Welcome, {invite.name} — {invite.position}, {invite.department}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {loading && <p className="text-gray-400">Checking your invite link...</p>}

          {!loading && invalid && (
            <div className="space-y-4 text-gray-300">
              <p>This invite link is invalid or has expired.</p>
              <p className="text-sm text-gray-500">
                Ask an admin to resend your invite from the Staff Management page.
              </p>
            </div>
          )}

          {!loading && invite && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                  minLength={8}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 hover:opacity-90"
                style={{ backgroundColor: `hsl(${hue},70%,50%)`, color: 'white' }}
              >
                {submitting ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="text-center text-gray-400 text-sm justify-center">
          <button onClick={() => router.push('/auth/signin')} className="hover:text-white cursor-pointer">
            Back to Sign In
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
