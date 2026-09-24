'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useHue } from '@/context/HueContext';
import useHueAnimation from '@/hooks/animation';
import { toast } from 'sonner';

export default function SignUpPage() {
  const router = useRouter();
  const hue = useHue();
  useHueAnimation();

  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);

  const [staffData, setStaffData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
  });

  const [userData, setUserData] = useState({
    username: '',
    password: '',
  });

  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const departments = ['Administration','Fuel Management'];

  const positionsByDept: Record<string, string[]> = {
    Administration: ['Finance', 'Supervisor'],
    'Fuel Management': ['Fuel Supervisor'],
  };

  // Check if users exist
  useEffect(() => {
    fetch('/api/users/check')
      .then(res => res.json())
      .then(data => setHasUsers(data.hasUser));
  }, []);

  if (hasUsers === null) return null; // Loading

  const filteredPositions = staffData.department ? positionsByDept[staffData.department] : [];

  const handleNextStep = () => setStep((prev) => prev + 1);
  const handlePrevStep = () => setStep((prev) => prev - 1);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      // 1️⃣ Create Staff
      const staffRes = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      const staff = await staffRes.json();

      if (!staffRes.ok) throw new Error(staff.message || 'Staff creation failed');

      // 2️⃣ Create User (the server decides the role from the staff position)
      const userRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, staffId: staff._id }),
      });
      const user = await userRes.json();

      if (!userRes.ok) throw new Error(user.message || 'User creation failed');

      toast.success('Account created successfully! You can now sign in.');
      router.push('/auth/signin');
    } catch (err) {
      console.error(err);
      // Surface the actual reason (duplicate email, taken username, ...)
      // instead of a generic "try again".
      toast.error(err instanceof Error ? err.message : 'Signup failed, please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center text-white relative overflow-hidden transition-colors duration-500"
      style={{
        background: `linear-gradient(135deg, hsl(${hue},30%,8%) 0%, hsl(${(hue+40)%360},25%,10%) 100%)`,
      }}
    >
      <Card className="w-full max-w-md bg-gray-900/70 backdrop-blur-lg border-gray-800 shadow-2xl rounded-sm z-10" style={{ borderColor: `hsl(${hue},70%,40%)` }}>
        <CardHeader className="text-right space-y-2">
          <CardTitle className="text-2xl font-bold uppercase" style={{ color: `hsl(${hue},70%,60%)` }}>
            {step === 1 && 'Staff Profile'}
            {step === 2 && 'Account Setup'}
            {step === 3 && 'Review Information'}
            {step === 4 && 'Terms & Conditions'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {step === 1 && 'Enter your staff details'}
            {step === 2 && 'Set up your login account'}
            {step === 3 && 'Review info before proceeding'}
            {step === 4 && 'Accept terms to complete registration'}
          </CardDescription>
          <div className="flex justify-start mt-2 gap-2">
            {[1,2,3,4].map((s) => (
              <span key={s} className={`w-8 h-2 rounded-full ${s <= step ? `bg-[hsl(${hue},70%,60%)]` : 'bg-gray-700'}`}></span>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Staff Profile */}
          {step === 1 && (
            <form className="space-y-4">
              <Input placeholder="Full Name" value={staffData.name} onChange={(e) => setStaffData({ ...staffData, name: e.target.value })} required />
              <Input type="email" placeholder="Email" value={staffData.email} onChange={(e) => setStaffData({ ...staffData, email: e.target.value })} required />
              <Input placeholder="Phone" value={staffData.phone} onChange={(e) => setStaffData({ ...staffData, phone: e.target.value })} required />
              <Select onValueChange={(v) => setStaffData({ ...staffData, department: v })}>
                <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white"><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent className="bg-gray-900">
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
              {staffData.department && (
                <Select onValueChange={(v) => setStaffData({ ...staffData, position: v })}>
                  <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white"><SelectValue placeholder="Position" /></SelectTrigger>
                  <SelectContent className="bg-gray-900">
                    {filteredPositions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <div className="flex justify-between mt-2">
                <div></div>
                <Button onClick={handleNextStep}>Next</Button>
              </div>
            </form>
          )}

          {/* Step 2: Account Setup */}
          {step === 2 && (
            <form className="space-y-4">
              <Input placeholder="Username" value={userData.username} onChange={(e) => setUserData({ ...userData, username: e.target.value })} required />
              <Input type="password" placeholder="Password" value={userData.password} onChange={(e) => setUserData({ ...userData, password: e.target.value })} required />
              <div className="flex justify-between mt-2">
                <Button variant="outline" onClick={handlePrevStep}>Back</Button>
                <Button onClick={handleNextStep}>Next</Button>
              </div>
            </form>
          )}

          {/* Step 3: Review Information */}
          {step === 3 && (
            <form className="space-y-4">
              <div className="text-gray-300">
                <h4 className="font-semibold mb-2 uppercase">Review Your Information:</h4>
                <p><strong>Fullname:</strong> {staffData.name}</p>
                <p><strong>Email:</strong> {staffData.email}</p>
                <p><strong>Phone:</strong> {staffData.phone}</p>
                <p><strong>Department:</strong> {staffData.department}</p>
                <p><strong>Position:</strong> {staffData.position}</p>
                <p><strong>Username:</strong> {userData.username}</p>
              </div>
              <div className="flex justify-between mt-2">
                <Button variant="outline" onClick={handlePrevStep}>Back</Button>
                <Button onClick={handleNextStep}>Proceed to Terms</Button>
              </div>
            </form>
          )}

          {/* Step 4: Terms & Conditions */}
          {step === 4 && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="text-gray-300 h-full overflow-y-auto scroll-hidden">
                <h4 className="font-semibold mb-4 uppercase">Terms & Conditions</h4>
                <p>
                  By creating an account, you agree to abide by the rules and regulations of this system. 
                </p>
                <p className="mt-2">
                  All personal information must be accurate. Unauthorized use or misuse of system resources may result in account suspension or termination.
                </p>
                <p className="mt-2">
                  The system administrators reserve the right to monitor, manage, and audit account activity for security and operational purposes.
                </p>
              </div>
              <label className="flex items-center gap-2 pb-4">
                <input type="checkbox" checked={agreedTerms} onChange={() => setAgreedTerms(!agreedTerms)} required />
                I agree to the terms & conditions
              </label>
              <div className="flex justify-between mt-2">
                <Button variant="outline" onClick={handlePrevStep}>Back</Button>
                <Button type="submit" disabled={!agreedTerms || submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>

        {hasUsers && step === 1 && (
          <CardFooter className="text-gray-400 text-center">
            Already have an account? <button onClick={() => router.push('/auth/signin')} style={{ color: `hsl(${hue},70%,60%)` }}>Sign in</button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}