"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { getInstagramUrl, getWhatsAppUrl } from "@/lib/config/site";
import { cn } from "@/lib/utils";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.3.4.6.2 1 .5 1.5 1 .4.4.7.9 1 1.5.2.4.4 1.1.4 2.3.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.3-.2.6-.5 1-1 1.5-.4.4-.9.7-1.5 1-.4.2-1.1.4-2.3.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.5-1.5-1-.4-.4-.7-.9-1-1.5-.2-.4-.4-1.1-.4-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.3.2-.6.5-1 1-1.5.4-.4.9-.7 1.5-1 .4-.2 1.1-.4 2.3-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.2 0-3.5 0-4.8.1-1 .1-1.5.2-1.9.4-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.2.4-.3.9-.4 1.9-.1 1.2-.1 1.6-.1 4.8s0 3.5.1 4.8c.1 1 .2 1.5.4 1.9.2.5.4.8.7 1.1.3.3.6.5 1.1.7.4.2.9.3 1.9.4 1.2.1 1.6.1 4.8.1s3.5 0 4.8-.1c1-.1 1.5-.2 1.9-.4.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.2-.4.3-.9.4-1.9.1-1.2.1-1.6.1-4.8s0-3.5-.1-4.8c-.1-1-.2-1.5-.4-1.9-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.5-1.1-.7-.4-.2-.9-.3-1.9-.4-1.3-.1-1.6-.1-4.8-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 1.8a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2zm6.2-2a1.2 1.2 0 1 1-2.3 0 1.2 1.2 0 0 1 2.3 0z" />
    </svg>
  );
}

export function FloatingSocialButtons({ className }: { className?: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) {
    return null;
  }

  const whatsappHref = getWhatsAppUrl();
  const instagramHref = getInstagramUrl();

  const buttons = [
    {
      id: "whatsapp",
      href: whatsappHref,
      label: "Chat on WhatsApp",
      className:
        "bg-[#25D366] hover:bg-[#1ebe57] text-white shadow-lg shadow-green-600/30",
      icon: <MessageCircle className="w-5 h-5" aria-hidden="true" />,
    },
    {
      id: "instagram",
      href: instagramHref,
      label: "Follow on Instagram",
      className:
        "bg-linear-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] hover:brightness-110 text-white shadow-lg shadow-pink-600/25",
      icon: <InstagramIcon className="w-5 h-5" />,
    },
  ] as const;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-3",
        "right-3 bottom-20 sm:right-5 sm:bottom-6",
        className
      )}
    >
      {buttons.map((btn, i) => (
        <motion.a
          key={btn.id}
          href={btn.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={btn.label}
          title={btn.label}
          initial={{ opacity: 0, x: 24, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.35 + i * 0.1, type: "spring", stiffness: 260 }}
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--primary))]",
            btn.className
          )}
        >
          <motion.span
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
            className="flex"
          >
            {btn.icon}
          </motion.span>
        </motion.a>
      ))}
    </div>
  );
}
