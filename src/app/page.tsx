"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, type Variants } from "framer-motion";
import {
  ArrowRight, Leaf, Shield, Truck, Award, Star,
  ChevronRight, Mountain, Flower2, Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/shared/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { categories, testimonials, heroSlides } from "@/lib/mock-data";
import { ParentBrandSection } from "@/components/home/parent-brand-section";
import { HeroParentBrandStrip } from "@/components/home/hero-parent-brand-strip";
import { productApi } from "@/services/api";
import type { Product } from "@/types/product";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={stagger}
      className="text-center mb-12"
    >
      <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-3">
        <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold tracking-wider uppercase">
          <Leaf className="w-3 h-3 mr-1" />{badge}
        </Badge>
      </motion.div>
      <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-gradient mb-3">
        {title}
      </motion.h2>
      <motion.p variants={fadeUp} className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto text-base">
        {subtitle}
      </motion.p>
    </motion.div>
  );
}

export default function HomePage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    productApi
      .list({ limit: 12 })
      .then((res) => setCatalog(res.data ?? []))
      .catch(() => setCatalog([]))
      .finally(() => setProductsLoaded(true));
  }, []);

  const featuredProducts = (
    catalog.filter((p) => p.isFeatured).length
      ? catalog.filter((p) => p.isFeatured)
      : catalog
  ).slice(0, 8);
  const bestsellerProducts = (
    catalog.filter((p) => p.isBestseller).length
      ? catalog.filter((p) => p.isBestseller)
      : catalog
  ).slice(0, 4);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img
            src={heroSlides[0].image}
            alt="Himalayan landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 gradient-himalaya opacity-80" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[hsl(var(--background))]/50" />
        </motion.div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 right-[10%] text-6xl opacity-40">🏔️</motion.div>
          <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-32 left-[5%] text-4xl opacity-30">🌿</motion.div>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute top-[40%] right-[5%] text-3xl opacity-30">🍎</motion.div>
        </div>

        <div className="absolute inset-0 pattern-dots opacity-10" />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 container mx-auto px-4 max-w-7xl pt-6 sm:pt-8">
          <div className="max-w-3xl">
            <HeroParentBrandStrip />

            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium">{heroSlides[0].badge}</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              From the <span className="text-[hsl(var(--accent))]">Heart</span> of the Himalayas
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="text-white/80 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
              {heroSlides[0].description}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/products" className="w-full sm:w-auto">
                <Button size="xl" variant="saffron" className="gap-2 font-semibold shadow-2xl w-full sm:w-auto">
                  Explore Products <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <Button size="xl" className="bg-white/10 border border-white/30 text-white hover:bg-white/20 gap-2 w-full sm:w-auto">
                  Our Story <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-8 gap-y-4 sm:gap-8 mt-10 sm:mt-12">
              {[{ value: "2000+", label: "Happy Customers" }, { value: "50+", label: "Products" }, { value: "100%", label: "Organic" }, { value: "4.9★", label: "Rating" }].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/60 text-[10px] sm:text-xs uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-white/50 text-xs uppercase tracking-widest">Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* Trust badges */}
      <section className="py-10 bg-[hsl(var(--muted))]/50 border-y">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Leaf, label: "100% Organic", desc: "No pesticides, no chemicals" },
              { icon: Shield, label: "Authentic Products", desc: "Direct from farms & artisans" },
              { icon: Truck, label: "Free Shipping", desc: "On orders above ₹999" },
              { icon: Award, label: "Premium Quality", desc: "Handpicked for excellence" },
            ].map((item) => (
              <motion.div key={item.label} variants={fadeUp} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-forest flex items-center justify-center shrink-0 shadow-md">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 sm:py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader badge="Browse by Category" title="Explore Our Collections" subtitle="From mountain farms to skilled artisans — discover the finest of Himachal Pradesh" />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <Link href={`/products?category=${cat.slug}`}>
                  <motion.div whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-shadow">
                    <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-2xl mb-1 block">{cat.icon}</span>
                      <h3 className="text-white font-bold text-sm leading-tight">{cat.name}</h3>
                      <p className="text-white/70 text-xs">{cat.count} products</p>
                    </div>
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-3 h-3 text-white" />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-20 bg-[hsl(var(--muted))]/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader badge="Featured Products" title="Our Best Sellers" subtitle="Handpicked products that our customers love the most — authentic, fresh, and premium quality" />
          {productsLoaded && featuredProducts.length === 0 ? (
            <EmptyState
              compact
              title="Featured products coming soon"
              description="We are still adding products to this collection."
              primaryAction={{ label: "Browse Products", href: "/products" }}
            />
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <motion.div key={product.id} variants={fadeUp} className="h-full">
                  <ProductCard product={product} className="h-full" />
                </motion.div>
              ))}
            </motion.div>
          )}
          <div className="text-center mt-10">
            <Link href="/products">
              <Button size="lg" variant="outline" className="gap-2">
                View All Products <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Story Banner */}
      <section className="py-14 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://picsum.photos/seed/bh-story-banner/1600/900" alt="Himachal Pradesh mountains" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-r from-[hsl(142,38%,15%)]/95 via-[hsl(142,38%,15%)]/80 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 max-w-7xl">
          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <Badge variant="saffron" className="mb-4">Our Story</Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Rooted in the <span className="text-[hsl(var(--accent))]">Himalayas</span>, Delivered with Love
              </h2>
              <p className="text-white/80 text-lg mb-6 leading-relaxed">
                BharmouriRoots was born from a simple idea: to bring the pure, untouched goodness of Bharmour&apos;s mountains to every Indian home. We work directly with local farmers and artisans, ensuring fair prices and authentic quality.
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
                {[{ icon: Mountain, label: "Mountain Sourced", desc: "2000m+ altitude" }, { icon: Flower2, label: "Organic Farms", desc: "Pesticide-free" }, { icon: Wind, label: "Pure Air", desc: "Clean ecosystem" }].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                      <item.icon className="w-5 h-5 text-[hsl(var(--accent))]" />
                    </div>
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    <p className="text-white/60 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/about">
                <Button variant="saffron" size="lg" className="gap-2">
                  Discover Our Story <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader badge="Top Picks" title="Community Favorites" subtitle="Products loved and trusted by thousands of satisfied customers" />
          {productsLoaded && bestsellerProducts.length === 0 ? (
            <EmptyState
              compact
              title="Bestsellers coming soon"
              description="This section will fill up once products are available."
              primaryAction={{ label: "Browse Products", href: "/products" }}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {bestsellerProducts.map((product, i) => (
                <motion.div key={product.id} className="h-full" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <ProductCard product={product} className="h-full" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Parent brand */}
      <ParentBrandSection />

      {/* Testimonials */}
      <section className="py-12 sm:py-20 bg-[hsl(var(--muted))]/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader badge="Customer Love" title="What Our Customers Say" subtitle="Real stories from real customers who've experienced the magic of the Himalayas" />
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div key={t.id} variants={fadeUp} whileHover={{ y: -4 }} className="bg-[hsl(var(--card))] rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[hsl(var(--foreground))]/80 text-sm leading-relaxed mb-4 italic">&ldquo;{t.comment}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-[hsl(var(--primary))]/30" />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{t.location} · {t.date}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Badge variant="secondary" className="text-[10px]">Purchased: {t.product}</Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 sm:py-20 gradient-himalaya relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="relative container mx-auto px-4 max-w-7xl text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <span className="text-4xl sm:text-5xl mb-4 block">🏔️</span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Experience the Himalayas<br className="hidden sm:block" /> in Every Purchase
            </h2>
            <p className="text-white/70 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
              Join 2000+ happy customers who have made BharmouriRoots their trusted source for authentic Himachali products.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link href="/products" className="w-full sm:w-auto">
                <Button size="xl" variant="saffron" className="gap-2 shadow-2xl w-full sm:w-auto">
                  Shop Now <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button size="xl" className="bg-white/10 border border-white/30 text-white hover:bg-white/20 w-full sm:w-auto">
                  Talk to Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
