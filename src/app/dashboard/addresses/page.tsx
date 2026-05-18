"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus, Edit, Trash2, Home, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const mockAddresses = [
  {
    id: "1",
    type: "home",
    name: "Priya Sharma",
    phone: "+91 98765 43210",
    address: "123 Mountain View Colony, Near Deodar Park",
    city: "Shimla",
    state: "Himachal Pradesh",
    pincode: "171001",
    isDefault: true,
  },
  {
    id: "2",
    type: "work",
    name: "Priya Sharma",
    phone: "+91 98765 43210",
    address: "456 Business Hub, Sector 7",
    city: "Chandigarh",
    state: "Punjab",
    pincode: "160019",
    isDefault: false,
  },
];

export default function AddressesPage() {
  const [addresses, setAddresses] = useState(mockAddresses);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Address removed" });
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    toast({ title: "Default address updated" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Saved Addresses</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{addresses.length} saved address{addresses.length !== 1 ? "es" : ""}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Address
        </Button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[hsl(var(--card))] rounded-2xl border p-5">
              <h3 className="font-bold mb-4">New Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Full Name</Label>
                  <Input placeholder="Full name" className="h-10" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Phone Number</Label>
                  <Input placeholder="+91 00000 00000" className="h-10" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="mb-1.5 block">Address</Label>
                  <Input placeholder="House no., Street, Area" className="h-10" />
                </div>
                <div>
                  <Label className="mb-1.5 block">City</Label>
                  <Input placeholder="City" className="h-10" />
                </div>
                <div>
                  <Label className="mb-1.5 block">State</Label>
                  <Input placeholder="State" className="h-10" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Pincode</Label>
                  <Input placeholder="000000" maxLength={6} className="h-10" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Address Type</Label>
                  <div className="flex gap-3 mt-2">
                    {["Home", "Work", "Other"].map((t) => (
                      <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="type" value={t.toLowerCase()} defaultChecked={t === "Home"} className="accent-[hsl(var(--primary))]" />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <Button onClick={() => { setShowForm(false); toast({ title: "Address saved!" }); }} className="gap-2">Save Address</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address cards */}
      <div className="space-y-4">
        {addresses.map((addr, i) => (
          <motion.div
            key={addr.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-[hsl(var(--card))] rounded-2xl border-2 p-5 ${addr.isDefault ? "border-[hsl(var(--primary))]/40" : "border-[hsl(var(--border))]"}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-3">
                {addr.type === "home" ? (
                  <div className="w-8 h-8 rounded-lg gradient-forest flex items-center justify-center">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent))] flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold capitalize">{addr.type}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold">Default</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="w-8 h-8 px-0"><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" className="w-8 h-8 px-0 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(addr.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[hsl(var(--muted-foreground))] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{addr.name}</p>
                <p className="text-[hsl(var(--muted-foreground))]">{addr.address}</p>
                <p className="text-[hsl(var(--muted-foreground))]">{addr.city}, {addr.state} - {addr.pincode}</p>
                <p className="text-[hsl(var(--muted-foreground))]">{addr.phone}</p>
              </div>
            </div>

            {!addr.isDefault && (
              <button
                onClick={() => handleSetDefault(addr.id)}
                className="mt-3 text-xs text-[hsl(var(--primary))] hover:underline font-medium"
              >
                Set as default address
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
