"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  IconSpeedboat,
  IconMapPin,
  IconTicket,
  IconShield,
} from "@tabler/icons-react";

import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  const features = [
    { icon: IconSpeedboat, title: "Trip Booking" },
    { icon: IconMapPin, title: "Route Selection" },
    { icon: IconTicket, title: "Ticket Management" },
    { icon: IconShield, title: "Secure Access" },
  ];

  return (
    <div className="min-h-svh bg-gradient-to-br from-blue-100/80 via-background to-green-100/60 dark:from-blue-900/30 dark:via-background dark:to-green-900/20 relative overflow-hidden font-sans">
      {/* Enhanced Maritime Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Larger Floating Elements */}
        <div className="absolute top-16 left-8 w-40 h-40 bg-primary/8 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-16 right-8 w-56 h-56 bg-green-500/8 rounded-full blur-2xl animate-pulse [animation-delay:1s]"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-blue-400/6 rounded-full blur-xl animate-pulse [animation-delay:2s]"></div>
        <div className="absolute top-2/3 left-1/3 w-28 h-28 bg-primary/6 rounded-full blur-xl animate-pulse [animation-delay:3s]"></div>

        {/* Enhanced Moving Waves */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-60">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/12 to-transparent"></div>
          <div
            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-primary/15 via-transparent to-primary/15 rounded-full"
            style={{
              animation: "wave 8s ease-in-out infinite",
              transform: "translateX(-50%)",
              width: "250%",
            }}
          ></div>
          <div
            className="absolute bottom-3 left-0 right-0 h-8 bg-gradient-to-r from-transparent via-green-500/12 to-transparent rounded-full"
            style={{
              animation: "wave 6s ease-in-out infinite reverse",
              transform: "translateX(-50%)",
              width: "250%",
              animationDelay: "2s",
            }}
          ></div>
          <div
            className="absolute bottom-6 left-0 right-0 h-6 bg-gradient-to-r from-blue-400/8 via-transparent to-blue-400/8 rounded-full"
            style={{
              animation: "wave 10s ease-in-out infinite",
              transform: "translateX(-50%)",
              width: "200%",
              animationDelay: "4s",
            }}
          ></div>
        </div>

        {/* More Visible Floating Dots */}
        <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-primary/25 rounded-full animate-bounce [animation-delay:1s] [animation-duration:3s]"></div>
        <div className="absolute top-2/3 left-1/5 w-2.5 h-2.5 bg-green-500/25 rounded-full animate-bounce [animation-delay:2s] [animation-duration:4s]"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-blue-400/30 rounded-full animate-bounce [animation-delay:3s] [animation-duration:5s]"></div>
        <div className="absolute top-1/6 right-1/5 w-2 h-2 bg-primary/20 rounded-full animate-bounce [animation-delay:4s] [animation-duration:6s]"></div>
        <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-green-500/30 rounded-full animate-bounce [animation-delay:5s] [animation-duration:4s]"></div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes wave {
          0%,
          100% {
            transform: translateX(-50%) translateY(0px);
          }
          50% {
            transform: translateX(-50%) translateY(-4px);
          }
        }
      `}</style>

      <div className="relative z-10 flex min-h-svh">
        {/* Left Panel - Simplified */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/ayahay-icon.png"
                alt="Ayahay Logo"
                width={40}
                height={40}
                className="rounded-lg"
                priority
              />
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Ayahay Travel
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Travel Agency Portal
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight leading-tight">
              Travel Agent Dashboard
            </h2>
            <p className="text-muted-foreground mb-6 font-medium leading-relaxed">
              Book trips, manage passengers, and track commissions.
            </p>

            <div className="grid gap-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground tracking-tight">
                    {feature.title}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-sm mx-auto">
            {/* Mobile Logo - Simplified */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex lg:hidden flex-col items-center gap-3 mb-6"
            >
              <Image
                src="/ayahay-icon.png"
                alt="Ayahay Logo"
                width={48}
                height={48}
                className="rounded-lg shadow-md"
                priority
              />
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Ayahay Travel
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  Travel Agency Portal
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <LoginForm />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
