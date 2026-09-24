'use client';

import { useEffect, useRef, useState } from 'react';
import { useHue } from '@/context/HueContext';
import { useSession } from 'next-auth/react';
import gsap from 'gsap';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  FaTruck,
  FaGasPump,
  FaFileAlt,
  FaCar,
  FaUsers,
  FaUserShield,
} from 'react-icons/fa';

// Define interface for backend metrics
interface DashboardMetrics {
  trips: number;
  vehicles: number;
  fuelRequests: number;
  reports: number;
  users?: number;
  staff?: number;
  recentActivity: {
    action: string;
    user: string;
    timestamp: string;
  }[];
}

export default function DashboardPage() {
  const hue = useHue();
  const { data: session } = useSession();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const role = session?.user.role ?? 'staff';

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      );
    }

    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/dashboard/metrics');
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const cards = [
    { label: 'Trips', icon: <FaTruck size={24} />, metric: metrics?.trips ?? 0, desc: 'Active trips in progress' },
    { label: 'Vehicles', icon: <FaCar size={24} />, metric: metrics?.vehicles ?? 0, desc: 'Registered vehicles' },
    { label: 'Requests', icon: <FaGasPump size={24} />, metric: metrics?.fuelRequests ?? 0, desc: 'Pending approvals' },
    ...(role === 'admin'
      ? [
          { label: 'Staff', icon: <FaUsers size={24} />, metric: metrics?.staff ?? 0, desc: 'Active staff members' },
          { label: 'Users', icon: <FaUserShield size={24} />, metric: metrics?.users ?? 0, desc: 'System user accounts' },
          { label: 'Reports', icon: <FaFileAlt size={24} />, metric: metrics?.reports ?? 0, desc: 'Recent reports generated' },
        ]
      : []),
  ];

  return (
    <div className="space-y-10">
      {/* Title */}
      <h1
        ref={titleRef}
        className="text-2xl font-bold tracking-tight uppercase"
        style={{ color: `hsl(${hue},70%,60%)` }}
      >
        Dashboard Overview
      </h1>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map(({ label, icon, metric, desc }, index) => (
          <motion.div
            key={label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <Card
              className="bg-gray-900/60 border border-gray-800 hover:shadow-lg hover:shadow-[hsl(var(--hue),70%,40%)/0.3] transition-transform hover:scale-[1.03] rounded-sm"
              style={{
                borderColor: `hsl(${hue}, 60%, 50%)`,
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle
                  className="text-base"
                  style={{ color: `hsl(${hue},70%,65%)` }}
                >
                  {label}
                </CardTitle>
                <div
                  className="p-2 rounded-sm"
                  style={{
                    background: `hsl(${hue}, 70%, 20%)`,
                    color: `hsl(${hue}, 70%, 60%)`,
                  }}
                >
                  {icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-100">
                  {loading ? '...' : metric}
                </div>
                <p className="text-sm text-gray-400 mt-1">{desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Section */}
      {role === 'admin' && (
        <Card className="bg-gray-900/60 border border-gray-800 mt-8">
          <CardHeader>
            <CardTitle style={{ color: `hsl(${hue},70%,65%)` }}>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-400">Loading activity...</p>
            ) : metrics?.recentActivity?.length ? (
              <ul className="space-y-2">
                {metrics.recentActivity.map((item, idx) => (
                  <li key={idx} className="text-gray-300 text-sm">
                    {item.action}{' '}
                    <span className="text-gray-500 text-xs">
                      ({new Date(item.timestamp).toLocaleString()})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No recent activity recorded.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}