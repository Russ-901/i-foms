'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from '../../../components/Guard';
import Sidebar from '../../../components/layout/Sidebar';
import Topbar from '../../../components/layout/Topbar';
import { useHue } from '@/context/HueContext';

function DashboardInner({ children }: { children: React.ReactNode }) {
  const hue = useHue();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer whenever we navigate somewhere new. Adjusted
  // during render (React's recommended pattern for "reset state when a
  // dependency changes") rather than in an effect, so it takes effect in
  // the same render instead of causing an extra one.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setSidebarOpen(false);
  }

  return (
    <div
      className="flex h-screen max-h-screen text-gray-200 transition-colors duration-300"
      style={{
        background: `linear-gradient(135deg,
          hsl(${(hue + 120) % 360}, 40%, 6%) 0%,
          hsl(${(hue + 160) % 360}, 30%, 10%) 100%)`,
      }}
    >
      <Sidebar hue={hue} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop behind the drawer on small screens */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar hue={hue} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardInner>{children}</DashboardInner>
    </AuthGuard>
  );
}
