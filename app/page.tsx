'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import gsap from 'gsap';
import { Button } from '@/components/ui/button';
import { useHue } from '@/context/HueContext';

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();
  const hue = useHue();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Animate logo and text
    if (logoRef.current && subRef.current) {
      gsap.fromTo(
        logoRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }
      );
      gsap.fromTo(
        subRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, delay: 0.4, duration: 1, ease: 'power3.out' }
      );
    }

    // Redirect after small delay based on session
    const timer = setTimeout(() => {
      if (status === 'authenticated') router.push('/dashboard');
      else if (status === 'unauthenticated') router.push('/auth/signin');
    }, 2500);

    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-[#0b0b0f] via-[#11111a] to-[#0b0b0f] text-gray-200"
    >
      {/* Glowing rings background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/3 left-1/4 w-[300px] h-[300px] opacity-20 blur-[180px] rounded-full animate-pulse"
          style={{ backgroundColor: `hsl(${hue},70%,50%)` }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] opacity-20 blur-[200px] rounded-full animate-pulse"
          style={{ backgroundColor: `hsl(${hue},60%,50%)` }}
        />
      </div>

      {/* Logo */}
      <h1
        ref={logoRef}
        className="relative z-10 text-6xl md:text-7xl font-extrabold tracking-wide text-center"
        style={{
          color: `hsl(${hue},70%,60%)`,
          textShadow: `0 0 25px hsl(${hue},70%,50%)`,
        }}
      >
        i-FOMS
      </h1>

      {/* Subtitle */}
      <p ref={subRef} className="mt-4 text-gray-400 text-lg">
        Intelligent Fleet Operations Management System
      </p>

      {/* Spinner */}
      <div
        className="mt-12 relative w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: `hsl(${hue},70%,60%)`, borderTopColor: 'transparent' }}
      />

      {/* Fallback manual button if redirect delays */}
      <Button
        onClick={() =>
          status === 'authenticated'
            ? router.push('/dashboard')
            : router.push('/auth/signin')
        }
        className="mt-8 text-white hover:opacity-90 z-10"
        style={{ backgroundColor: `hsl(${hue},70%,50%)` }}
      >
        Continue
      </Button>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}