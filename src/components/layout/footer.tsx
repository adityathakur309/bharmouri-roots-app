"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Leaf, Globe, Link2, MessageCircle, Play, Phone, Mail, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getInstagramUrl } from "@/lib/config/site";
import { usePublicSettings } from "@/hooks/use-public-settings";
import { formatBusinessAddress } from "@/types/settings";

const footerLinks = {
  shop: [
    { label: "Organic Dals", href: "/products?category=organic-dals" },
    { label: "Dry Fruits & Nuts", href: "/products?category=dry-fruits" },
    { label: "Pure Honey", href: "/products?category=honey" },
    { label: "Himachali Shawls", href: "/products?category=shawls" },
    { label: "Traditional Topi", href: "/products?category=topi" },
    { label: "All Products", href: "/products" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Story", href: "/about#story" },
    { label: "Farmers & Artisans", href: "/about#artisans" },
    { label: "Blog", href: "/blog" },
    { label: "Contact Us", href: "/contact" },
    { label: "Careers", href: "/careers" },
  ],
  support: [
    { label: "FAQ", href: "/contact#faq" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Refund & Returns", href: "/returns" },
    { label: "Cancellation", href: "/cancellation" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Track Order", href: "/dashboard/orders" },
  ],
};

const socialLinks = [
  { icon: Globe, hrefKey: "instagram" as const, label: "Instagram" },
  { icon: Link2, href: "#", label: "Facebook" },
  { icon: MessageCircle, href: "#", label: "Twitter" },
  { icon: Play, href: "#", label: "YouTube" },
];

export function Footer() {
  const { settings } = usePublicSettings();
  const year = new Date().getFullYear();
  const instagramHref = settings.instagram || getInstagramUrl();

  return (
    <footer className="bg-[hsl(25_15%_8%)] dark:bg-[hsl(25_15%_5%)] text-white">
      {/* CTA Banner */}
      <div className="gradient-himalaya py-12">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Get 10% Off Your First Order
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Subscribe to our newsletter for exclusive deals, seasonal offers, and stories from the Himalayas.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white"
              />
              <Button variant="saffron" className="shrink-0 gap-1">
                Subscribe <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 max-w-7xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-xl gradient-forest flex items-center justify-center shadow-lg">
                <Leaf className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">{settings.businessName}</span>
                <p className="text-xs text-white/50 -mt-0.5 uppercase tracking-wider">Pure Himachali</p>
              </div>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs">
              From the pristine valleys of Bharmour, we bring you the finest organic produce and handcrafted treasures of Himachal Pradesh, delivered with love and authenticity.
            </p>

            {/* Contact */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <MapPin className="w-4 h-4 text-[hsl(var(--accent))] shrink-0" />
                <span>{formatBusinessAddress(settings)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Phone className="w-4 h-4 text-[hsl(var(--accent))] shrink-0" />
                <span>{settings.supportPhone || settings.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Mail className="w-4 h-4 text-[hsl(var(--accent))] shrink-0" />
                <span>{settings.supportEmail || settings.email}</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={"hrefKey" in social ? instagramHref : social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-[hsl(var(--primary))] transition-colors"
                >
                  <social.icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Shop", links: footerLinks.shop },
            { title: "Company", links: footerLinks.company },
            { title: "Support", links: footerLinks.support },
          ].map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-white mb-4 uppercase tracking-wider text-xs">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-[hsl(var(--accent))] transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 bg-white/10" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>© {year} {settings.businessName}. All rights reserved. Made with care in Himachal Pradesh.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              100% Secure Payments
            </span>
            <span>UPI · Cards · Net Banking{settings.codEnabled ? " · COD" : ""}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
