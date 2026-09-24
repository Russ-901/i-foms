"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Mail, Sparkles } from "lucide-react";

export default function VerifyEmailPage() {
    const bgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const hue = gsap.to(bgRef.current, {
            filter: 'hue-rotate(360deg)',
            duration: 15,
            repeat: -1,
            ease: 'none',
        });

        return () => void hue.kill(); // ✅ ensures cleanup returns void
    }, []);

    return (
        <div
        ref={bgRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white"
        >
        {/* Floating particles */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_60%)]"
        ></motion.div>

        {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="z-10 flex flex-col items-center text-center px-6"
        >
            <Mail size={80} className="text-emerald-400 mb-4 animate-float drop-shadow-lg" />
            <h1 className="text-3xl font-bold mb-2">
            Check Your Inbox 📬
            </h1>
            <p className="text-gray-300 max-w-md">
            We’ve sent a verification link to your email address.
            Please click the link to verify your account before signing in.
            </p>

            <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8"
            >
            <a
                href="/auth/signin"
                className="px-6 py-3 bg-emerald-500 text-white rounded-none hover:bg-emerald-600 transition shadow-md"
            >
                Back to Sign In
            </a>
            </motion.div>
        </motion.div>

        {/* Decorative sparkles */}
        <Sparkles
            size={60}
            className="absolute bottom-10 right-10 text-emerald-400 animate-pulse opacity-30"
        />
        <Sparkles
            size={40}
            className="absolute top-10 left-10 text-blue-400 animate-pulse opacity-30"
        />
        </div>
    );
}