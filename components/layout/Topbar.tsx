'use client';

import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useHue } from '@/context/HueContext';
import { LogOut, Menu } from 'lucide-react';

interface TopbarProps {
  hue?: number;
  onMenuClick?: () => void;
}

export default function Topbar({ hue, onMenuClick }: TopbarProps) {
  const { data } = useSession();
  const currentHue = useHue();
  const activeHue = hue ?? currentHue; // fallback to context hue

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b shadow-sm transition-colors duration-300 backdrop-blur-md bg-[#0f0f17]/70"
    >
      {/* Left Section */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-300 hover:text-white cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2
          className="text-lg md:text-xl font-semibold tracking-wide truncate"
          style={{
            color: `hsl(${activeHue}, 70%, 60%)`,
          }}
        >
          {data?.user?.name ?? 'User'}
        </h2>
      </div>

      {/* Right Section */}
      <motion.button
        onClick={() => signOut()}
        whileHover={{
          scale: 1.05,
          boxShadow: `0 0 10px hsl(${activeHue}, 70%, 55%)`,
        }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer"
        style={{
          background: `linear-gradient(90deg, hsl(${activeHue}, 70%, 45%), hsl(${(activeHue + 30) % 360}, 100%, 18%))`,
          color: '#fff',
        }}
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </motion.button>
    </header>
  );
}