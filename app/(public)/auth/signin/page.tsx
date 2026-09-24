'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useHue } from '@/context/HueContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const router = useRouter();
  const hue = useHue();

  // Check if any users exist
  useEffect(() => {
    const checkUsers = async () => {
      try {
        const res = await fetch('/api/users/check'); // new API route
        const data = await res.json();
        console.log(data.hasUser)
        if (!data.hasUser) {
          setShowSignupPrompt(true);
        }
      } catch (err) {
        console.error('Error checking users:', err);
      }
    };
    checkUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      router.push('/dashboard');
      router.refresh(); // picks up the new session cookie in server components
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden transition-colors duration-500"
      style={{
        background: `linear-gradient(135deg,
          hsl(${hue}, 30%, 8%) 0%,
          hsl(${(hue + 40) % 360}, 25%, 10%) 100%)`,
      }}
    >
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <Card
        className="w-full max-w-md bg-gray-900/70 backdrop-blur-lg border-gray-800 shadow-2xl rounded-sm z-10"
        style={{ borderColor: `hsl(${hue}, 70%, 40%)` }}
      >
        <CardHeader className="text-center space-y-2 mb-4">
          <CardTitle
            className="text-2xl font-bold flex justify-start items-center gap-2 flex-row-reverse uppercase"
            style={{ color: `hsl(${hue}, 70%, 60%)` }}
          >
            Sign In
          </CardTitle>
          <CardDescription className="text-gray-400 text-end">Access your dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white rounded-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-4 rounded-sm font-semibold transition-all duration-300 cursor-pointer text-white"
              style={{
                background: `linear-gradient(90deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 30) % 360}, 100%, 18%))`,
              }}
            >
              Sign In
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-gray-400 text-sm mt-2 flex items-center justify-center"></CardFooter>
      </Card>

      {/* Signup Prompt Modal */}
      {showSignupPrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-gray-900 rounded-sm p-6 max-w-md w-full border text-left h-[280px] flex flex-col justify-center" style={{ borderColor: `hsl(${hue}, 70%, 40%)` }}>
            <h2 className="text-2xl font-bold mb-2 text-right uppercase" style={{ color: `hsl(${hue}, 70%, 60%)` }}>No Users Found</h2>
            <p className="text-gray-300 my-4">It seems there are no accounts yet. Please create the first admin account.</p>
            <Button onClick={() => router.push('/auth/signup')} className="w-full text-white rounded-sm mt-4 cursor-pointer" style={{ background: `linear-gradient(90deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 30) % 360}, 100%, 18%))` }}>
              Create Account
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}