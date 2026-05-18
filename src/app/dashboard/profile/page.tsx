"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Camera, Save, Shield, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name, phone });
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">My Profile</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage your personal information</p>
      </div>

      <div className="bg-[hsl(var(--card))] rounded-2xl border p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[hsl(var(--primary))]/30">
              <img src={user?.avatar ?? "https://i.pravatar.cc/100?img=47"} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full gradient-forest flex items-center justify-center shadow-md">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div>
            <h2 className="font-bold text-lg">{user?.name}</h2>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">{user?.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Verified Account</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label className="mb-1.5 block">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="h-11" />
          </div>
          <div>
            <Label className="mb-1.5 block">Email Address</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11" />
          </div>
          <div>
            <Label className="mb-1.5 block">Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 00000 00000" className="h-11" />
          </div>
          <div>
            <Label className="mb-1.5 block">Date of Birth</Label>
            <Input type="date" className="h-11" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Gender</Label>
            <div className="flex gap-3">
              {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gender" value={g} className="accent-[hsl(var(--primary))]" />
                  <span className="text-sm">{g}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-32">
            {isSaving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { label: "Order updates", desc: "Receive updates about your orders via email and SMS" },
            { label: "Promotions & offers", desc: "Exclusive deals and discount codes for members" },
            { label: "New arrivals", desc: "Be the first to know about new Himachali products" },
            { label: "Newsletter", desc: "Monthly stories and news from the Himalayas" },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                <div className="w-10 h-5 bg-[hsl(var(--muted))] rounded-full peer peer-checked:bg-[hsl(var(--primary))] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
