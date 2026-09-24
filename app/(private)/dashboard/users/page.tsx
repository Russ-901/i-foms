'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useHue } from '@/context/HueContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import { User, Staff } from '@/types/models';
import { toast } from 'sonner';

export default function UsersPage() {
  const hue = useHue();
  const [users, setUsers] = useState<User[]>([]);
  const [staffWithoutUser, setStaffWithoutUser] = useState<Staff[]>([]);
  const [form, setForm] = useState({
    staffId: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchStaffWithoutUser();
  }, []);

  async function fetchUsers() {
    const res = await fetch('/api/users');
    setUsers(await res.json());
  }

  async function fetchStaffWithoutUser() {
    const resStaff = await fetch('/api/staff');
    const staffList = await resStaff.json();

    const resUsers = await fetch('/api/users');
    const userList = await resUsers.json();

    const usedStaffIds = new Set(userList.map((u: User) => u.staffId?._id));
    const availableStaff = staffList.filter((s: Staff) => !usedStaffIds.has(s._id));
    setStaffWithoutUser(availableStaff);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success('User account created.');
      setForm({ staffId: '', username: '', password: '' });
      fetchUsers();
      fetchStaffWithoutUser();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.message || 'Failed to create user account.');
    }
  }

  return (
    <div className="space-y-6">
      <h1
        className="text-2xl uppercase font-bold"
        style={{ color: `hsl(${hue},70%,60%)` }}
      >
        User Accounts
      </h1>

      {/* Create User Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="text-white hover:opacity-90"
            style={{ backgroundColor: `hsl(${hue},70%,50%)` }}
          >
            + New User
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-gray-900 border text-white w-md h-[400px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              className="uppercase"
              style={{ color: `hsl(${hue},70%,60%)` }}
            >
              Create New User
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Staff Selector */}
            <Select
              onValueChange={(v) => setForm({ ...form, staffId: v })}
              value={form.staffId}
            >
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select Staff Member" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {staffWithoutUser.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name} ({s.position})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />

            <Input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />

            <Button
              type="submit"
              className="w-full mt-4 text-white font-semibold hover:opacity-90"
              style={{
                background: `linear-gradient(90deg, hsl(${hue},70%,45%), hsl(${(hue + 30) % 360},100%,18%))`,
              }}
            >
              Create User
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Table */}
      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-800">
              {['Username', 'Email', 'Role'].map((h) => (
                <TableHead key={h} className="text-gray-300">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u, i) => (
              <TableRow
                key={u._id}
                style={{ animation: `fadeIn 0.5s ease ${i * 0.05}s both` }}
              >
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.staffId?.email}</TableCell>
                <TableCell>{u.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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