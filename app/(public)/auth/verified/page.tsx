"use client";

import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import Link from "next/link";

export default function VerifiedPage() {
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
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white relative overflow-hidden"
        >
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="z-10 text-center px-6"
        >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-pulse" />
            <h1 className="text-3xl font-bold mb-2">Email Verified!</h1>
            <p className="text-gray-300 max-w-md mx-auto">
            Your email has been successfully verified. You can now log in to your account.
            </p>

            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
            >
            <Link
                href="/auth/signin"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-all duration-300 shadow-md"
            >
                Go to Sign In
            </Link>
            </motion.div>
        </motion.div>
        </div>
    );
}