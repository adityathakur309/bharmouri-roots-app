"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, ChevronDown, ChevronUp, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { faqs } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { usePublicSettings } from "@/hooks/use-public-settings";
import { formatBusinessAddress } from "@/types/settings";

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const { toast } = useToast();
  const { settings } = usePublicSettings();

  const contactCards = [
    {
      icon: Phone,
      label: "Phone",
      value: settings.supportPhone || settings.phone,
      desc: settings.hours,
      color: "gradient-forest",
    },
    {
      icon: Mail,
      label: "Email",
      value: settings.supportEmail || settings.email,
      desc: "We reply within 24 hours",
      color: "gradient-saffron",
    },
    {
      icon: MapPin,
      label: "Address",
      value: `${settings.city}, ${settings.state}`,
      desc: `${settings.addressLine} · ${settings.pincode}`,
      color: "gradient-forest",
    },
    {
      icon: Clock,
      label: "Hours",
      value: settings.hours.split(",")[0] || settings.hours,
      desc: settings.hours,
      color: "gradient-saffron",
    },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSending(false);
    toast({
      title: "Message received",
      description: `We'll reply to you at ${settings.supportEmail || settings.email}.`,
    });
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="gradient-himalaya py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="relative container mx-auto max-w-7xl text-center text-white">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Leaf className="w-10 h-10 mx-auto mb-4 text-[hsl(var(--accent))]" />
            <h1 className="text-3xl md:text-5xl font-bold mb-3">Get in Touch</h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">
              Have questions about our products or need help with your order? We&apos;re here to help!
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-16">
        {/* Contact cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        >
          {contactCards.map((card) => (
            <motion.div
              key={card.label}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="bg-[hsl(var(--card))] rounded-2xl border p-5 text-center hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center mx-auto mb-3 shadow-md`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold mb-1">{card.label}</p>
              <p className="text-sm font-medium text-[hsl(var(--primary))]">{card.value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact form */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Your Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required className="h-11" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Email Address *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required className="h-11" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">Subject</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What is this about?" className="h-11" />
              </div>
              <div>
                <Label className="mb-1.5 block">Message *</Label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  required
                  rows={5}
                  className="w-full px-3 py-2 rounded-xl border bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none"
                />
              </div>
              <Button type="submit" size="lg" className="w-full gap-2" disabled={isSending}>
                {isSending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSending ? "Sending..." : "Send Message"}
              </Button>
            </form>

            {/* Map placeholder */}
            <div className="mt-8 rounded-2xl overflow-hidden border h-52 bg-[hsl(var(--muted))]/50 flex items-center justify-center relative">
              <div className="absolute inset-0 pattern-grid opacity-30" />
              <div className="relative text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--primary))]" />
                <p className="font-semibold">{settings.city}, {settings.state}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {formatBusinessAddress(settings)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* FAQ */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold">Frequently Asked</h2>
              <Badge variant="secondary" className="text-xs">Questions</Badge>
            </div>

            <div className="space-y-3" id="faq">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-[hsl(var(--muted))]/30 transition-colors"
                  >
                    <span className="font-semibold text-sm pr-4">{faq.question}</span>
                    {openFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-[hsl(var(--primary))] shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[hsl(var(--muted-foreground))] shrink-0" />
                    )}
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? "auto" : 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed border-t pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Bulk orders CTA */}
            <div className="mt-6 p-5 gradient-forest rounded-2xl text-white">
              <h3 className="font-bold text-lg mb-2">Bulk / Corporate Orders?</h3>
              <p className="text-white/70 text-sm mb-4">
                Planning to order in bulk for corporate gifting or events? We offer special pricing for large orders.
              </p>
              <Button variant="saffron" size="sm" className="gap-2">
                <Mail className="w-4 h-4" /> Contact Our Team
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
