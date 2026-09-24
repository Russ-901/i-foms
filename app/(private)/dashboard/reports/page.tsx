'use client';

import { useEffect, useState, useMemo } from 'react';
import { useHue } from '@/context/HueContext';
import { useSession } from 'next-auth/react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import {
  Card, CardHeader, CardTitle, CardContent
} from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { Fuel, Staff, Trip, Vehicle } from '@/types/models';

export default function ReportsPage() {
  const hue = useHue();
  const { data: session } = useSession();

  // 🧠 Declare all state hooks first (fixed order)
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelRequests, setFuelRequests] = useState<Fuel[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  // 🎨 Then define useMemo AFTER useState hooks, BEFORE useEffect hooks
  const COLORS = useMemo(
    () => [
      `hsl(${hue}, 80%, 60%)`,
      `hsl(${hue + 40}, 70%, 55%)`,
      `hsl(${hue + 80}, 65%, 50%)`,
      `hsl(${hue + 120}, 75%, 60%)`,
      `hsl(${hue + 160}, 70%, 55%)`,
      `hsl(${hue + 200}, 65%, 50%)`,
    ],
    [hue]
  );

  // 🔁 Stable useEffect for data fetching
  useEffect(() => {
    async function fetchData() {
      try {
        const [tripsData, vehiclesData, fuelData, staffData] = await Promise.all([
          fetch('/api/trips').then(r => r.json()),
          fetch('/api/vehicles').then(r => r.json()),
          fetch('/api/fuel').then(r => r.json()),
          fetch('/api/staff').then(r => r.json()),
        ]);

        if (session?.user.role === 'staff') {
          setTrips(tripsData.filter((t: Trip) => t.requestedBy?._id === session.user.id));
          setFuelRequests(fuelData.filter((f: Fuel) => f.requestedBy?._id === session.user.id));
        } else {
          setTrips(tripsData);
          setFuelRequests(fuelData);
        }

        // Only include "Driver" and "Senior Driver"
        setStaff(staffData.filter((s: Staff) => ['Driver', 'Senior Driver'].includes(s.position)));
        setVehicles(vehiclesData);

        gsap.from('.report-card', { opacity: 0, y: 30, stagger: 0.2, duration: 1 });
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    }

    fetchData();
  }, [session]);

  // 📊 Computed analytics data
  const tripsPerVehicle = vehicles.map((v: Vehicle) => ({
    vehicle: v.plateNumber,
    trips: trips.filter((t: Trip) => (t.vehicleId?._id ?? t.vehicleId) === v._id).length,
  }));

  const fuelStatusCounts = ['Pending', 'Approved', 'Rejected', 'Cancelled'].map(status => ({
    name: status,
    value: fuelRequests.filter(f => f.status === status).length,
  }));

  const tripsPerDriver = staff.map(s => ({
    driver: s.name,
    trips: trips.filter(t => t.driverName === s.name).length,
  }));

  const tripsPerDepartment = Array.from(new Set(staff.map(s => s.department))).map(department => ({
    department,
    trips: staff
      .filter(s => s.department === department)
      .reduce((total, s) => total + trips.filter(t => t.driverName === s.name).length, 0),
  }));

  // 🎨 Component Render
  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h1
        className="text-2xl font-bold uppercase"
        style={{
          color: `hsl(${hue}, 90%, 65%)`,
        }}
      >
        Reports & Analytics
      </h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 🚗 Trips per Vehicle */}
        <Card className="report-card backdrop-blur-md bg-gray-900/40 border border-gray-800/70 shadow-2xl rounded-2xl">
          <CardHeader><CardTitle>Trips Per Vehicle</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripsPerVehicle}>
                <CartesianGrid strokeDasharray="4 4" stroke={`hsl(${hue}, 20%, 30%)`} />
                <XAxis dataKey="vehicle" stroke={`hsl(${hue},70%,70%)`} />
                <YAxis stroke={`hsl(${hue},70%,70%)`} />
                <Tooltip contentStyle={{ background: '#1a1a1a', borderRadius: '10px' }} />
                <Legend />
                <Bar dataKey="trips" fill={`hsl(${hue},80%,60%)`} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 👨‍✈️ Trips per Driver */}
        <Card className="report-card backdrop-blur-md bg-gray-900/40 border border-gray-800/70 shadow-2xl rounded-2xl">
          <CardHeader><CardTitle>Trips Per Driver</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripsPerDriver}>
                <CartesianGrid strokeDasharray="3 3" stroke={`hsl(${hue}, 25%, 35%)`} />
                <XAxis dataKey="driver" stroke={`hsl(${hue},70%,70%)`} />
                <YAxis stroke={`hsl(${hue},70%,70%)`} />
                <Tooltip contentStyle={{ background: '#1a1a1a', borderRadius: '10px' }} />
                <Legend />
                <Bar dataKey="trips" fill={`hsl(${hue + 40},80%,60%)`} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ⛽ Fuel Request Status */}
        <Card className="report-card backdrop-blur-md bg-gray-900/40 border border-gray-800/70 shadow-2xl rounded-2xl">
          <CardHeader><CardTitle>Fuel Request Status</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fuelStatusCounts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  label
                >
                  {fuelStatusCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 🏢 Trips Per Department */}
        <Card className="report-card backdrop-blur-md bg-gray-900/40 border border-gray-800/70 shadow-2xl rounded-2xl">
          <CardHeader><CardTitle>Trips Per Department</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tripsPerDepartment}>
                <CartesianGrid strokeDasharray="4 4" stroke={`hsl(${hue}, 25%, 35%)`} />
                <XAxis dataKey="department" stroke={`hsl(${hue},70%,70%)`} />
                <YAxis stroke={`hsl(${hue},70%,70%)`} />
                <Tooltip contentStyle={{ background: '#1a1a1a', borderRadius: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="trips"
                  stroke={`hsl(${hue + 120},80%,60%)`}
                  strokeWidth={3}
                  dot={{ fill: `hsl(${hue + 120},80%,60%)` }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
