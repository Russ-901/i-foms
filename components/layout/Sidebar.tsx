'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import {
  FaTachometerAlt,
  FaTruck,
  FaGasPump,
  FaFileAlt,
  FaCar,
  FaUsers,
  FaUserShield,
  FaMapMarkedAlt,
  FaRoute
} from 'react-icons/fa';

interface SidebarProps {
  hue: number;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ hue, open = false, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const role = session?.user.role ?? 'staff';

  const links = [
    { href: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard' },
    { href: '/dashboard/field', icon: <FaRoute />, label: 'My Trips' },
    { href: '/dashboard/vehicles', icon: <FaCar />, label: 'Vehicles' },
    { href: '/dashboard/trips', icon: <FaTruck />, label: 'Trips' },
    { href: '/dashboard/fuel', icon: <FaGasPump />, label: 'Fuel' },
    { href: '/dashboard/tracking', icon: <FaMapMarkedAlt />, label: 'Tracking' },
    ...(role === 'admin'
      ? [
          { href: '/dashboard/staff', icon: <FaUsers />, label: 'Staff' },
          { href: '/dashboard/users', icon: <FaUserShield />, label: 'Users' },
          { href: '/dashboard/reports', icon: <FaFileAlt />, label: 'Reports' },
        ]
      : []),
  ];

  return (
    <motion.aside
      initial={false}
      className={`w-64 shrink-0 p-4 border-r border-gray-800 bg-gray-950/95 lg:bg-gray-950/60 backdrop-blur-lg
        fixed inset-y-0 left-0 z-40 overflow-y-auto transition-transform duration-300
        lg:static lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ borderColor: `hsl(${hue}, 60%, 50%)` }}
    >
      <div className="flex items-center justify-between mb-8">
        <div
          className="text-xl font-bold tracking-wide uppercase"
          style={{ color: `hsl(${hue}, 70%, 60%)` }}
        >
          {role} account
        </div>
        {/* Only needed for the mobile drawer */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white cursor-pointer"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="space-y-2">
        {links.map(({ href, icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-2 p-2 rounded transition-all ${
                active ? 'bg-gray-800 text-white' : 'hover:bg-gray-800'
              }`}
            >
              <span style={{ color: `hsl(${hue}, 80%, 60%)` }}>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
