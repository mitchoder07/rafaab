/* eslint-disable @typescript-eslint/no-require-imports */
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

// Load image map produced by the image-fetch subagent
const imageMap: Record<string, string[]> = require("../seed-data/images.json");
const heroImages: string[] = imageMap["__hero__"] || [];
const categoryImages: Record<string, string[]> = imageMap["__categories__"] || {};

function imgs(query: string, fallbackSeed: string): string[] {
  const urls = imageMap[query];
  if (urls && urls.length) return urls;
  return [
    `https://picsum.photos/seed/${fallbackSeed}/800/800`,
    `https://picsum.photos/seed/${fallbackSeed}2/800/800`,
    `https://picsum.photos/seed/${fallbackSeed}3/800/800`,
  ];
}

type CategoryDef = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  imageQueryKey: string;
};

type ProductDef = {
  title: string;
  slug: string;
  description: string;
  brand: string;
  price: number;
  discountPrice?: number;
  stock: number;
  imageQuery: string;
  fallbackSeed: string;
  specs: { name: string; value: string }[];
  tags: string[];
  rating: number;
  numReviews: number;
  soldCount: number;
  flags: { flashSale?: boolean; featured?: boolean; bestSeller?: boolean; newArrival?: boolean };
};

const categories: CategoryDef[] = [
  { name: "Electronics", slug: "electronics", icon: "Tv", color: "#f97316", imageQueryKey: "Electronics" },
  { name: "Phones & Tablets", slug: "phones-tablets", icon: "Smartphone", color: "#06b6d4", imageQueryKey: "Phones & Tablets" },
  { name: "Fashion", slug: "fashion", icon: "Shirt", color: "#ec4899", imageQueryKey: "Fashion" },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "Home", color: "#84cc16", imageQueryKey: "Home & Kitchen" },
  { name: "Beauty & Health", slug: "beauty-health", icon: "Sparkles", color: "#f43f5e", imageQueryKey: "Beauty & Health" },
  { name: "Sports & Outdoors", slug: "sports-outdoors", icon: "Dumbbell", color: "#10b981", imageQueryKey: "Sports & Outdoors" },
  { name: "Toys & Games", slug: "toys-games", icon: "Gamepad2", color: "#f59e0b", imageQueryKey: "Toys & Games" },
  { name: "Groceries", slug: "groceries", icon: "ShoppingBasket", color: "#a855f7", imageQueryKey: "Groceries" },
];

const products: ProductDef[] = [
  // ===== Electronics =====
  {
    title: "Rafaab Studio Pro Wireless Noise-Cancelling Headphones",
    slug: "rafaab-studio-pro-headphones",
    description:
      "Immerse yourself in pure sound with the Rafaab Studio Pro. Featuring adaptive active noise cancellation, 40-hour battery life, and plush memory-foam ear cushions. Bluetooth 5.3 with multipoint pairing keeps you connected to two devices at once.",
    brand: "Rafaab Audio",
    price: 89900,
    discountPrice: 64900,
    stock: 120,
    imageQuery: "wireless over-ear headphones product photo",
    fallbackSeed: "headphones1",
    specs: [
      { name: "Driver", value: "40mm dynamic" },
      { name: "Battery Life", value: "40 hours" },
      { name: "Bluetooth", value: "5.3 multipoint" },
      { name: "Charging", value: "USB-C fast charge" },
      { name: "Weight", value: "250g" },
    ],
    tags: ["headphones", "audio", "bluetooth", "noise-cancelling"],
    rating: 4.8,
    numReviews: 1243,
    soldCount: 5400,
    flags: { flashSale: true, featured: true, bestSeller: true },
  },
  {
    title: 'UltraView 55" 4K UHD Smart LED TV',
    slug: "ultraview-55-4k-smart-tv",
    description:
      'Bring the cinema home with the UltraView 55-inch 4K TV. HDR10+ support, built-in streaming apps, and a bezel-less design. Dolby Audio delivers rich, room-filling sound.',
    brand: "UltraView",
    price: 320000,
    discountPrice: 274900,
    stock: 45,
    imageQuery: "smart 4k television on stand product",
    fallbackSeed: "tv1",
    specs: [
      { name: "Screen Size", value: '55 inches' },
      { name: "Resolution", value: "3840 x 2160 (4K)" },
      { name: "HDR", value: "HDR10+ / Dolby Vision" },
      { name: "Refresh Rate", value: "60Hz" },
      { name: "Ports", value: "3x HDMI, 2x USB" },
    ],
    tags: ["tv", "4k", "smart tv", "electronics"],
    rating: 4.6,
    numReviews: 842,
    soldCount: 2100,
    flags: { featured: true },
  },
  {
    title: "MechPro RGB Mechanical Gaming Keyboard",
    slug: "mechpro-rgb-mechanical-keyboard",
    description:
      "Tactile blue switches, full RGB backlighting, and an aircraft-grade aluminum frame. Anti-ghosting with N-key rollover for competitive play. Hot-swappable switches let you customize your feel.",
    brand: "MechPro",
    price: 38500,
    discountPrice: 29900,
    stock: 200,
    imageQuery: "mechanical gaming keyboard rgb",
    fallbackSeed: "keyboard1",
    specs: [
      { name: "Switches", value: "Blue tactile, hot-swappable" },
      { name: "Layout", value: "Full-size 104 keys" },
      { name: "Backlight", value: "16.8M RGB per-key" },
      { name: "Connection", value: "USB-C wired" },
    ],
    tags: ["keyboard", "gaming", "rgb", "mechanical"],
    rating: 4.7,
    numReviews: 631,
    soldCount: 3200,
    flags: { flashSale: true, bestSeller: true },
  },
  {
    title: "FitPulse Series 7 Smartwatch",
    slug: "fitpulse-series-7-smartwatch",
    description:
      "Track 100+ workout modes, heart rate, SpO2, and sleep with the FitPulse Series 7. 1.9\" AMOLED display, 14-day battery, and 5ATM water resistance. Receive calls and notifications on your wrist.",
    brand: "FitPulse",
    price: 65000,
    discountPrice: 47900,
    stock: 80,
    imageQuery: "smartwatch fitness tracker on wrist",
    fallbackSeed: "watch1",
    specs: [
      { name: "Display", value: '1.9" AMOLED' },
      { name: "Battery", value: "14 days typical" },
      { name: "Water Resistance", value: "5ATM" },
      { name: "Sensors", value: "HR, SpO2, accelerometer" },
    ],
    tags: ["smartwatch", "fitness", "wearable"],
    rating: 4.5,
    numReviews: 1890,
    soldCount: 7600,
    flags: { featured: true, bestSeller: true, newArrival: true },
  },
  {
    title: "ActionCam 4K Waterproof Action Camera",
    slug: "actioncam-4k-waterproof-camera",
    description:
      "Capture every adventure in stunning 4K60fps. Electronic image stabilization, 10m waterproof without a case, and a 2-inch touchscreen. Includes accessory mount kit.",
    brand: "ActionCam",
    price: 92000,
    discountPrice: 71900,
    stock: 60,
    imageQuery: "action camera 4k product",
    fallbackSeed: "camera1",
    specs: [
      { name: "Video", value: "4K @ 60fps" },
      { name: "Photo", value: "20MP" },
      { name: "Waterproof", value: "10m bare" },
      { name: "Stabilization", value: "6-axis EIS" },
    ],
    tags: ["camera", "action cam", "4k", "waterproof"],
    rating: 4.4,
    numReviews: 412,
    soldCount: 1500,
    flags: { newArrival: true },
  },

  // ===== Phones & Tablets =====
  {
    title: "Rafaab Phone Pro Max 256GB",
    slug: "rafaab-phone-pro-max-256gb",
    description:
      'Flagship power with a 6.7" 120Hz AMOLED display, triple 108MP camera system, and the all-day 5000mAh battery. 65W fast charging gets you to 100% in 35 minutes.',
    brand: "Rafaab",
    price: 485000,
    discountPrice: 429900,
    stock: 35,
    imageQuery: "modern smartphone product photo",
    fallbackSeed: "phone1",
    specs: [
      { name: "Display", value: '6.7" AMOLED 120Hz' },
      { name: "Storage", value: "256GB" },
      { name: "Camera", value: "108MP triple" },
      { name: "Battery", value: "5000mAh, 65W fast charge" },
    ],
    tags: ["smartphone", "phone", "flagship", "5g"],
    rating: 4.9,
    numReviews: 2310,
    soldCount: 8900,
    flags: { flashSale: true, featured: true, bestSeller: true, newArrival: true },
  },
  {
    title: "Galaxy Lite 128GB Smartphone",
    slug: "galaxy-lite-128gb-smartphone",
    description:
      'A reliable everyday phone with a 6.5" display, 50MP camera, and 5000mAh battery. Smooth performance at a budget-friendly price.',
    brand: "Galaxy",
    price: 145000,
    discountPrice: 119900,
    stock: 140,
    imageQuery: "modern smartphone product photo",
    fallbackSeed: "phone2",
    specs: [
      { name: "Display", value: '6.5" HD+' },
      { name: "Storage", value: "128GB + microSD" },
      { name: "Camera", value: "50MP dual" },
      { name: "Battery", value: "5000mAh" },
    ],
    tags: ["smartphone", "budget", "phone"],
    rating: 4.3,
    numReviews: 980,
    soldCount: 4200,
    flags: { bestSeller: true },
  },
  {
    title: 'TabSlate 10" Android Tablet',
    slug: "tabslate-10-android-tablet",
    description:
      'A 10-inch Full HD tablet perfect for streaming, browsing, and light work. Octa-core processor, 4GB RAM, and 64GB storage expandable up to 512GB.',
    brand: "TabSlate",
    price: 110000,
    discountPrice: 89900,
    stock: 90,
    imageQuery: "tablet device on table product",
    fallbackSeed: "tablet1",
    specs: [
      { name: "Display", value: '10" FHD IPS' },
      { name: "RAM", value: "4GB" },
      { name: "Storage", value: "64GB expandable" },
      { name: "Battery", value: "7000mAh" },
    ],
    tags: ["tablet", "android"],
    rating: 4.4,
    numReviews: 540,
    soldCount: 1800,
    flags: { featured: true },
  },
  {
    title: 'TabPro 12" Tablet with Stylus',
    slug: "tabpro-12-tablet-stylus",
    description:
      'A 12-inch 2K display tablet with a precision stylus included. Ideal for creatives and professionals. 8GB RAM and 256GB storage.',
    brand: "TabPro",
    price: 295000,
    discountPrice: 259900,
    stock: 25,
    imageQuery: "tablet device on table product",
    fallbackSeed: "tablet2",
    specs: [
      { name: "Display", value: '12" 2K' },
      { name: "RAM", value: "8GB" },
      { name: "Storage", value: "256GB" },
      { name: "Stylus", value: "Included, 4096 pressure" },
    ],
    tags: ["tablet", "stylus", "premium"],
    rating: 4.6,
    numReviews: 310,
    soldCount: 950,
    flags: { newArrival: true },
  },
  {
    title: "Rafaab Phone Mini 5G",
    slug: "rafaab-phone-mini-5g",
    description:
      'Compact 6.1" 5G phone with a punchy OLED display and flagship-grade chipset. Perfect for one-handed use without compromise.',
    brand: "Rafaab",
    price: 215000,
    discountPrice: 189900,
    stock: 70,
    imageQuery: "modern smartphone product photo",
    fallbackSeed: "phone3",
    specs: [
      { name: "Display", value: '6.1" OLED' },
      { name: "Network", value: "5G" },
      { name: "Storage", value: "128GB" },
      { name: "Battery", value: "4200mAh" },
    ],
    tags: ["smartphone", "5g", "compact"],
    rating: 4.5,
    numReviews: 720,
    soldCount: 2600,
    flags: { newArrival: true },
  },

  // ===== Fashion =====
  {
    title: "Men's Premium Bomber Jacket",
    slug: "mens-premium-bomber-jacket",
    description:
      "A timeless bomber jacket crafted from water-resistant fabric with a ribbed cuffs and hem. Versatile layering for any season.",
    brand: "UrbanThread",
    price: 28500,
    discountPrice: 19900,
    stock: 150,
    imageQuery: "mens casual jacket fashion clothing",
    fallbackSeed: "jacket1",
    specs: [
      { name: "Material", value: "Polyester blend" },
      { name: "Fit", value: "Regular" },
      { name: "Care", value: "Machine washable" },
    ],
    tags: ["fashion", "jacket", "mens"],
    rating: 4.5,
    numReviews: 430,
    soldCount: 1900,
    flags: { flashSale: true, featured: true },
  },
  {
    title: "Women's Floral Summer Maxi Dress",
    slug: "womens-floral-summer-maxi-dress",
    description:
      "Flowy maxi dress with a vibrant floral print. Lightweight, breathable fabric perfect for warm days and evenings out.",
    brand: "BellaVita",
    price: 19500,
    discountPrice: 13900,
    stock: 180,
    imageQuery: "womens summer dress fashion clothing",
    fallbackSeed: "dress1",
    specs: [
      { name: "Material", value: "Rayon" },
      { name: "Length", value: "Maxi" },
      { name: "Care", value: "Hand wash" },
    ],
    tags: ["fashion", "dress", "womens", "summer"],
    rating: 4.7,
    numReviews: 610,
    soldCount: 3400,
    flags: { bestSeller: true, newArrival: true },
  },
  {
    title: "Aviator Polarized Sunglasses UV400",
    slug: "aviator-polarized-sunglasses",
    description:
      "Classic aviator silhouette with polarized UV400 lenses. Lightweight metal frame and scratch-resistant coating.",
    brand: "SunView",
    price: 12500,
    discountPrice: 7900,
    stock: 220,
    imageQuery: "designer sunglasses product photo",
    fallbackSeed: "sunglasses1",
    specs: [
      { name: "Lens", value: "Polarized UV400" },
      { name: "Frame", value: "Metal alloy" },
      { name: "Includes", value: "Case + cloth" },
    ],
    tags: ["fashion", "sunglasses", "accessories"],
    rating: 4.4,
    numReviews: 280,
    soldCount: 1200,
    flags: { flashSale: true },
  },
  {
    title: "UrbanStep White Sneakers",
    slug: "urbanstep-white-sneakers",
    description:
      "Minimalist white sneakers with a cushioned insole and breathable knit upper. Goes with everything in your wardrobe.",
    brand: "UrbanStep",
    price: 24500,
    discountPrice: 17900,
    stock: 110,
    imageQuery: "white sneakers shoes product photo",
    fallbackSeed: "sneakers1",
    specs: [
      { name: "Upper", value: "Knit textile" },
      { name: "Sole", value: "EVA foam" },
      { name: "Sizes", value: "38-46" },
    ],
    tags: ["fashion", "shoes", "sneakers"],
    rating: 4.6,
    numReviews: 890,
    soldCount: 4100,
    flags: { featured: true, bestSeller: true },
  },
  {
    title: "Men's Classic Denim Jacket",
    slug: "mens-classic-denim-jacket",
    description:
      "A wardrobe staple — rugged denim jacket with a timeless cut. Layer it over tees or shirts for effortless style.",
    brand: "UrbanThread",
    price: 22500,
    stock: 95,
    imageQuery: "mens casual jacket fashion clothing",
    fallbackSeed: "jacket2",
    specs: [
      { name: "Material", value: "100% cotton denim" },
      { name: "Fit", value: "Classic" },
      { name: "Care", value: "Machine wash cold" },
    ],
    tags: ["fashion", "jacket", "denim", "mens"],
    rating: 4.5,
    numReviews: 360,
    soldCount: 1500,
    flags: { newArrival: true },
  },

  // ===== Home & Kitchen =====
  {
    title: "Chef's Choice 10-Piece Cookware Set",
    slug: "chefs-choice-10pc-cookware-set",
    description:
      "Complete your kitchen with this 10-piece stainless steel cookware set. Induction-compatible, oven-safe, and tempered glass lids.",
    brand: "Chef's Choice",
    price: 65000,
    discountPrice: 48900,
    stock: 60,
    imageQuery: "stainless steel cookware pots set kitchen",
    fallbackSeed: "cookware1",
    specs: [
      { name: "Pieces", value: "10" },
      { name: "Material", value: "Stainless steel" },
      { name: "Compatible", value: "Induction, gas, electric" },
    ],
    tags: ["kitchen", "cookware", "home"],
    rating: 4.7,
    numReviews: 540,
    soldCount: 2200,
    flags: { featured: true, bestSeller: true },
  },
  {
    title: "RapidCrisp Digital Air Fryer 5L",
    slug: "rapidcrisp-digital-air-fryer-5l",
    description:
      "Crisp, roast, bake, and reheat with little to no oil. 5L capacity feeds a family, with 8 presets and a digital touch panel.",
    brand: "RapidCrisp",
    price: 52000,
    discountPrice: 38900,
    stock: 130,
    imageQuery: "air fryer kitchen appliance product",
    fallbackSeed: "airfryer1",
    specs: [
      { name: "Capacity", value: "5 liters" },
      { name: "Power", value: "1500W" },
      { name: "Presets", value: "8 one-touch" },
    ],
    tags: ["kitchen", "air fryer", "appliance"],
    rating: 4.6,
    numReviews: 1120,
    soldCount: 5800,
    flags: { flashSale: true, bestSeller: true },
  },
  {
    title: "BaristaPro Drip Coffee Maker",
    slug: "baristapro-drip-coffee-maker",
    description:
      "Brew café-quality coffee at home. 12-cup glass carafe, programmable timer, and a keep-warm plate. Pause-and-serve lets you pour mid-brew.",
    brand: "BaristaPro",
    price: 34500,
    discountPrice: 26900,
    stock: 85,
    imageQuery: "coffee maker machine kitchen product",
    fallbackSeed: "coffeemaker1",
    specs: [
      { name: "Capacity", value: "12 cups" },
      { name: "Programmable", value: "Yes, 24h timer" },
      { name: "Power", value: "900W" },
    ],
    tags: ["kitchen", "coffee", "appliance"],
    rating: 4.5,
    numReviews: 470,
    soldCount: 1900,
    flags: { featured: true },
  },
  {
    title: "Luxury Egyptian Cotton Sheet Set",
    slug: "luxury-egyptian-cotton-sheet-set",
    description:
      "Sleep in luxury with this 600-thread-count Egyptian cotton sheet set. Includes flat sheet, fitted sheet, and two pillowcases. Soft, breathable, and durable.",
    brand: "DreamWeave",
    price: 28000,
    discountPrice: 19900,
    stock: 100,
    imageQuery: "bedding bed sheet set home",
    fallbackSeed: "bedding1",
    specs: [
      { name: "Thread Count", value: "600" },
      { name: "Material", value: "Egyptian cotton" },
      { name: "Includes", value: "Flat, fitted, 2 pillowcases" },
    ],
    tags: ["home", "bedding", "sheets"],
    rating: 4.8,
    numReviews: 380,
    soldCount: 1700,
    flags: { newArrival: true },
  },
  {
    title: "Compact Air Fryer 3.5L",
    slug: "compact-air-fryer-3-5l",
    description:
      "Perfect for small households. 3.5L compact air fryer with rapid air technology and easy-clean non-stick basket.",
    brand: "RapidCrisp",
    price: 35000,
    stock: 75,
    imageQuery: "air fryer kitchen appliance product",
    fallbackSeed: "airfryer2",
    specs: [
      { name: "Capacity", value: "3.5 liters" },
      { name: "Power", value: "1200W" },
      { name: "Basket", value: "Non-stick, dishwasher safe" },
    ],
    tags: ["kitchen", "air fryer", "appliance"],
    rating: 4.4,
    numReviews: 290,
    soldCount: 1100,
    flags: {},
  },

  // ===== Beauty & Health =====
  {
    title: "GlowUp Vitamin C Serum Kit",
    slug: "glowup-vitamin-c-serum-kit",
    description:
      "Brighten and even your skin tone with this Vitamin C serum kit. Includes serum, moisturizer, and eye cream. Suitable for all skin types.",
    brand: "GlowUp",
    price: 18500,
    discountPrice: 12900,
    stock: 200,
    imageQuery: "skincare serum bottles cosmetics beauty",
    fallbackSeed: "skincare1",
    specs: [
      { name: "Includes", value: "Serum, moisturizer, eye cream" },
      { name: "Skin Type", value: "All" },
      { name: "Key Active", value: "15% Vitamin C" },
    ],
    tags: ["beauty", "skincare", "vitamin c"],
    rating: 4.6,
    numReviews: 760,
    soldCount: 4300,
    flags: { flashSale: true, featured: true, bestSeller: true },
  },
  {
    title: "ProPalette 35-Color Eyeshadow Palette",
    slug: "propalette-35-color-eyeshadow",
    description:
      "35 highly-pigmented shades from mattes to shimmers. Long-lasting, blendable formula for endless looks. Cruelty-free.",
    brand: "ProPalette",
    price: 14500,
    discountPrice: 9900,
    stock: 160,
    imageQuery: "makeup palette kit beauty product",
    fallbackSeed: "makeup1",
    specs: [
      { name: "Shades", value: "35" },
      { name: "Finish", value: "Matte + shimmer" },
      { name: "Cruelty-Free", value: "Yes" },
    ],
    tags: ["beauty", "makeup", "eyeshadow"],
    rating: 4.5,
    numReviews: 520,
    soldCount: 2800,
    flags: { bestSeller: true },
  },
  {
    title: "SilkFlow Ionic Hair Dryer",
    slug: "silkflow-ionic-hair-dryer",
    description:
      "Dry faster with less damage. Ionic technology reduces frizz, while the ceramic coil distributes heat evenly. 3 heat / 2 speed settings.",
    brand: "SilkFlow",
    price: 22000,
    discountPrice: 16900,
    stock: 90,
    imageQuery: "hair dryer product photo",
    fallbackSeed: "hairdryer1",
    specs: [
      { name: "Power", value: "2200W" },
      { name: "Technology", value: "Ionic + ceramic" },
      { name: "Settings", value: "3 heat, 2 speed" },
    ],
    tags: ["beauty", "hair", "appliance"],
    rating: 4.4,
    numReviews: 410,
    soldCount: 1600,
    flags: { newArrival: true },
  },
  {
    title: "Hydration Boost Skincare Bundle",
    slug: "hydration-boost-skincare-bundle",
    description:
      "Quench thirsty skin with hyaluronic acid serum, gel moisturizer, and hydrating toner. Lightweight, non-greasy, perfect for daily use.",
    brand: "GlowUp",
    price: 16500,
    stock: 140,
    imageQuery: "skincare serum bottles cosmetics beauty",
    fallbackSeed: "skincare2",
    specs: [
      { name: "Includes", value: "Serum, moisturizer, toner" },
      { name: "Key Active", value: "Hyaluronic acid" },
      { name: "Skin Type", value: "Dry / normal" },
    ],
    tags: ["beauty", "skincare", "hydration"],
    rating: 4.5,
    numReviews: 340,
    soldCount: 1400,
    flags: { featured: true },
  },

  // ===== Sports & Outdoors =====
  {
    title: "EcoGrip Premium Yoga Mat 6mm",
    slug: "ecogrip-premium-yoga-mat-6mm",
    description:
      "Non-slip, eco-friendly TPE yoga mat with 6mm cushioning. Lightweight with a carry strap. Free from PVC and latex.",
    brand: "EcoGrip",
    price: 15500,
    discountPrice: 10900,
    stock: 170,
    imageQuery: "yoga mat fitness exercise equipment",
    fallbackSeed: "yogamat1",
    specs: [
      { name: "Thickness", value: "6mm" },
      { name: "Material", value: "Eco TPE" },
      { name: "Dimensions", value: "183 x 61 cm" },
    ],
    tags: ["sports", "yoga", "fitness"],
    rating: 4.7,
    numReviews: 680,
    soldCount: 3900,
    flags: { flashSale: true, bestSeller: true },
  },
  {
    title: "PowerLift 20kg Adjustable Dumbbells",
    slug: "powerlift-20kg-adjustable-dumbbells",
    description:
      "Space-saving adjustable dumbbells. Dial from 2.5kg to 20kg per hand. Replaces a whole rack of weights.",
    brand: "PowerLift",
    price: 95000,
    discountPrice: 74900,
    stock: 40,
    imageQuery: "dumbbell weights set gym fitness",
    fallbackSeed: "dumbbell1",
    specs: [
      { name: "Max Weight", value: "20kg per hand" },
      { name: "Adjustment", value: "Dial system" },
      { name: "Increments", value: "2.5kg" },
    ],
    tags: ["sports", "fitness", "dumbbells", "gym"],
    rating: 4.6,
    numReviews: 320,
    soldCount: 1100,
    flags: { featured: true },
  },
  {
    title: "Wilderness 4-Person Camping Tent",
    slug: "wilderness-4-person-camping-tent",
    description:
      "Spacious 4-person dome tent with waterproof fly and UV protection. Easy pop-up setup in under 5 minutes. Includes carry bag and stakes.",
    brand: "Wilderness",
    price: 42000,
    discountPrice: 32900,
    stock: 55,
    imageQuery: "camping tent outdoor gear",
    fallbackSeed: "tent1",
    specs: [
      { name: "Capacity", value: "4 persons" },
      { name: "Setup", value: "Pop-up, <5 min" },
      { name: "Waterproof", value: "2000mm rating" },
    ],
    tags: ["sports", "outdoors", "camping", "tent"],
    rating: 4.5,
    numReviews: 290,
    soldCount: 980,
    flags: { newArrival: true },
  },
  {
    title: "ProFlow Non-Slip Yoga Mat 8mm",
    slug: "proflow-nonslip-yoga-mat-8mm",
    description:
      "Extra-thick 8mm cushioning for joint support. Dual-sided non-slip surface with alignment lines. Premium PU top layer.",
    brand: "ProFlow",
    price: 21000,
    stock: 110,
    imageQuery: "yoga mat fitness exercise equipment",
    fallbackSeed: "yogamat2",
    specs: [
      { name: "Thickness", value: "8mm" },
      { name: "Material", value: "PU + natural rubber" },
      { name: "Dimensions", value: "183 x 68 cm" },
    ],
    tags: ["sports", "yoga", "fitness", "premium"],
    rating: 4.6,
    numReviews: 240,
    soldCount: 850,
    flags: { newArrival: true },
  },
  {
    title: "Hex Dumbbell Pair 10kg",
    slug: "hex-dumbbell-pair-10kg",
    description:
      "Solid cast-iron hex dumbbells (pair, 10kg each). Rubber-coated heads protect floors. Contoured chrome handles for a secure grip.",
    brand: "PowerLift",
    price: 32000,
    discountPrice: 24900,
    stock: 70,
    imageQuery: "dumbbell weights set gym fitness",
    fallbackSeed: "dumbbell2",
    specs: [
      { name: "Weight", value: "10kg x 2" },
      { name: "Material", value: "Cast iron + rubber" },
      { name: "Handle", value: "Chrome, contoured" },
    ],
    tags: ["sports", "fitness", "dumbbells"],
    rating: 4.7,
    numReviews: 180,
    soldCount: 720,
    flags: { flashSale: true },
  },

  // ===== Toys & Games =====
  {
    title: "BuildMaster 1000-Piece Building Block Set",
    slug: "buildmaster-1000pc-block-set",
    description:
      "Spark creativity with 1000 colorful, compatible building blocks. Includes a storage bin and idea booklet. Ages 6+.",
    brand: "BuildMaster",
    price: 24500,
    discountPrice: 17900,
    stock: 130,
    imageQuery: "kids building blocks toy set",
    fallbackSeed: "blocks1",
    specs: [
      { name: "Pieces", value: "1000" },
      { name: "Age", value: "6+" },
      { name: "Includes", value: "Storage bin + idea book" },
    ],
    tags: ["toys", "blocks", "kids"],
    rating: 4.8,
    numReviews: 540,
    soldCount: 2600,
    flags: { flashSale: true, featured: true, bestSeller: true },
  },
  {
    title: "SpeedRacer RC Off-Road Car",
    slug: "speedracer-rc-offroad-car",
    description:
      "High-speed 1:16 RC car with 4WD and all-terrain tires. Reaches 25 km/h. 2.4GHz remote with up to 100m range. Includes rechargeable battery.",
    brand: "SpeedRacer",
    price: 28500,
    discountPrice: 21900,
    stock: 95,
    imageQuery: "remote control car toy",
    fallbackSeed: "rccar1",
    specs: [
      { name: "Scale", value: "1:16" },
      { name: "Top Speed", value: "25 km/h" },
      { name: "Range", value: "100m" },
    ],
    tags: ["toys", "rc car", "kids"],
    rating: 4.5,
    numReviews: 380,
    soldCount: 1500,
    flags: { newArrival: true },
  },
  {
    title: "CreativeBlocks City Town Building Set",
    slug: "creativeblocks-city-town-set",
    description:
      "Build a whole town with 600 pieces including figures, vehicles, and buildings. Compatible with major brick brands. Ages 5+.",
    brand: "CreativeBlocks",
    price: 32000,
    stock: 60,
    imageQuery: "kids building blocks toy set",
    fallbackSeed: "blocks2",
    specs: [
      { name: "Pieces", value: "600" },
      { name: "Age", value: "5+" },
      { name: "Includes", value: "Figures, vehicles, buildings" },
    ],
    tags: ["toys", "blocks", "kids"],
    rating: 4.6,
    numReviews: 220,
    soldCount: 870,
    flags: {},
  },
  {
    title: "Stunt RC Monster Truck",
    slug: "stunt-rc-monster-truck",
    description:
      "Perform 360° flips and stunts with this dual-sided RC monster truck. Shock-absorbing suspension and rugged tires for any terrain.",
    brand: "SpeedRacer",
    price: 26500,
    discountPrice: 19900,
    stock: 80,
    imageQuery: "remote control car toy",
    fallbackSeed: "rccar2",
    specs: [
      { name: "Stunt", value: "360° flip" },
      { name: "Drive", value: "Dual-sided" },
      { name: "Battery", value: "Rechargeable" },
    ],
    tags: ["toys", "rc car", "stunt", "kids"],
    rating: 4.4,
    numReviews: 290,
    soldCount: 1100,
    flags: { bestSeller: true },
  },

  // ===== Groceries =====
  {
    title: "Organic Arabica Coffee Beans 1kg",
    slug: "organic-arabica-coffee-beans-1kg",
    description:
      "Single-origin 100% Arabica beans, medium-roasted for a smooth, balanced cup. Ethically sourced and freshly packed.",
    brand: "Highland Roasters",
    price: 9500,
    discountPrice: 6900,
    stock: 250,
    imageQuery: "coffee beans bag grocery",
    fallbackSeed: "coffee1",
    specs: [
      { name: "Weight", value: "1kg" },
      { name: "Roast", value: "Medium" },
      { name: "Origin", value: "Single-origin Arabica" },
    ],
    tags: ["groceries", "coffee", "organic"],
    rating: 4.7,
    numReviews: 410,
    soldCount: 3200,
    flags: { flashSale: true, bestSeller: true },
  },
  {
    title: "Premium Roast Coffee Ground 500g",
    slug: "premium-roast-coffee-ground-500g",
    description:
      "Pre-ground for convenience. Rich, dark roast with notes of chocolate and caramel. Sealed for freshness.",
    brand: "Highland Roasters",
    price: 5500,
    stock: 300,
    imageQuery: "coffee beans bag grocery",
    fallbackSeed: "coffee2",
    specs: [
      { name: "Weight", value: "500g" },
      { name: "Roast", value: "Dark" },
      { name: "Grind", value: "Medium (filter)" },
    ],
    tags: ["groceries", "coffee"],
    rating: 4.5,
    numReviews: 260,
    soldCount: 1900,
    flags: { newArrival: true },
  },
  {
    title: "Espresso Dark Roast Beans 750g",
    slug: "espresso-dark-roast-beans-750g",
    description:
      "Espresso blend dark roast beans, low acidity with a thick crema. Perfect for espresso machines and moka pots.",
    brand: "Highland Roasters",
    price: 7800,
    discountPrice: 5900,
    stock: 180,
    imageQuery: "coffee beans bag grocery",
    fallbackSeed: "coffee3",
    specs: [
      { name: "Weight", value: "750g" },
      { name: "Roast", value: "Dark espresso" },
      { name: "Use", value: "Espresso, moka" },
    ],
    tags: ["groceries", "coffee", "espresso"],
    rating: 4.6,
    numReviews: 180,
    soldCount: 980,
    flags: { featured: true },
  },
];

const reviewComments = [
  "Absolutely love this! Exceeded my expectations. Fast delivery too.",
  "Great value for money. Quality is solid and it works as described.",
  "Exactly what I needed. Will definitely buy again from Rafaab.",
  "Good product, packaging was neat. Took a bit to arrive but worth the wait.",
  "Five stars! The quality is premium and the price is unbeatable.",
  "My family loves it. Highly recommend to anyone considering it.",
  "Solid build and looks even better in person. Very satisfied.",
  "Works perfectly. Customer support was helpful when I had questions.",
  "Amazing deal during the flash sale. Snagged it instantly.",
  "Better than the competitors I've tried. Rafaab is my go-to now.",
];

async function main() {
  console.log("Clearing existing data...");
  await db.trackingEvent.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.address.deleteMany();
  await db.user.deleteMany();

  // Create demo user
  const demoUser = await db.user.create({
    data: {
      email: "demo@rafaab.com",
      name: "Demo Shopper",
      password: hashPassword("demo1234"),
      phone: "+234 800 000 0000",
    },
  });

  // Create a guest/default user for reviews/cart fallback
  const guestUser = await db.user.create({
    data: {
      email: "guest@rafaab.com",
      name: "Rafaab Customer",
      password: hashPassword("guest1234"),
    },
  });

  // Create admin/seller user
  const adminUser = await db.user.create({
    data: {
      email: "admin@rafaab.com",
      name: "Rafaab Admin",
      password: hashPassword("admin1234"),
      role: "admin",
      phone: "+234 800 111 2222",
    },
  });

  // Save hero images globally via a fake product? No — expose via API file instead.
  // We'll store hero + category images in a separate JSON the API reads.

  // Create categories
  const categoryMap = new Map<string, string>();
  for (const c of categories) {
    const cat = await db.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        color: c.color,
        image: (categoryImages[c.imageQueryKey] && categoryImages[c.imageQueryKey][0]) || null,
      },
    });
    categoryMap.set(c.slug, cat.id);
  }

  // Create products
  const now = Date.now();
  let reviewCount = 0;
  for (const p of products) {
    const catSlug = slugFor(p);
    const catId = categoryMap.get(catSlug)!;

    const images = imgs(p.imageQuery, p.fallbackSeed);
    const flashEnd =
      p.flags.flashSale && p.discountPrice
        ? new Date(now + (1 + Math.floor(Math.random() * 11)) * 3600 * 1000) // 1-12h from now
        : null;

    const product = await db.product.create({
      data: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        price: p.price,
        discountPrice: p.discountPrice ?? null,
        stock: p.stock,
        images: JSON.stringify(images),
        specs: JSON.stringify(p.specs),
        tags: JSON.stringify(p.tags),
        rating: p.rating,
        numReviews: p.numReviews,
        soldCount: p.soldCount,
        categoryId: catId,
        isFlashSale: !!p.flags.flashSale,
        flashSaleEndsAt: flashEnd,
        isFeatured: !!p.flags.featured,
        isBestSeller: !!p.flags.bestSeller,
        isNewArrival: !!p.flags.newArrival,
      },
    });

    // Add a few reviews per product
    const nReviews = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < nReviews; i++) {
      const reviewer = i % 2 === 0 ? demoUser : guestUser;
      await db.review.create({
        data: {
          userId: reviewer.id,
          productId: product.id,
          rating: Math.min(5, Math.max(3, Math.round(p.rating) + (Math.random() > 0.7 ? -1 : 0))),
          comment: reviewComments[(reviewCount + i) % reviewComments.length],
        },
      });
      reviewCount++;
    }
  }

  // Save hero images to a small meta file the API can read
  const fs = require("fs");
  const path = require("path");
  const metaPath = path.join(process.cwd(), "seed-data", "meta.json");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ hero: heroImages }, null, 2)
  );

  // Create a few sample orders for the demo user with tracking events
  const allProducts = await db.product.findMany({ include: { category: true } });
  const sampleOrders = [
    {
      productIdx: [0, 6],
      status: "shipped",
      daysAgo: 2,
      carrier: "Rafaab Express",
      events: [
        { status: "confirmed", note: "Order received and payment confirmed.", location: "Lagos Fulfillment Center", hoursAgo: 50 },
        { status: "processing", note: "Order packed and ready for dispatch.", location: "Lagos Fulfillment Center", hoursAgo: 46 },
        { status: "shipped", note: "Order handed over to carrier.", location: "Lagos Hub", hoursAgo: 30 },
      ],
    },
    {
      productIdx: [12],
      status: "out_for_delivery",
      daysAgo: 3,
      carrier: "Rafaab Express",
      events: [
        { status: "confirmed", note: "Order received and payment confirmed.", location: "Lagos Fulfillment Center", hoursAgo: 72 },
        { status: "processing", note: "Order packed.", location: "Lagos Fulfillment Center", hoursAgo: 68 },
        { status: "shipped", note: "Picked up by carrier.", location: "Lagos Hub", hoursAgo: 48 },
        { status: "out_for_delivery", note: "Out for delivery to your area.", location: "Abuja Distribution Center", hoursAgo: 4 },
      ],
    },
    {
      productIdx: [16, 17],
      status: "delivered",
      daysAgo: 7,
      carrier: "Rafaab Express",
      events: [
        { status: "confirmed", note: "Order received and payment confirmed.", location: "Lagos Fulfillment Center", hoursAgo: 175 },
        { status: "processing", note: "Order packed.", location: "Lagos Fulfillment Center", hoursAgo: 170 },
        { status: "shipped", note: "Picked up by carrier.", location: "Lagos Hub", hoursAgo: 168 },
        { status: "out_for_delivery", note: "Out for delivery.", location: "Lagos Distribution Center", hoursAgo: 145 },
        { status: "delivered", note: "Delivered to customer.", location: "Customer Address", hoursAgo: 140 },
      ],
    },
    {
      productIdx: [20],
      status: "processing",
      daysAgo: 0,
      carrier: "Rafaab Express",
      events: [
        { status: "confirmed", note: "Order received and payment confirmed.", location: "Lagos Fulfillment Center", hoursAgo: 3 },
        { status: "processing", note: "Order is being prepared.", location: "Lagos Fulfillment Center", hoursAgo: 1 },
      ],
    },
  ];

  for (const so of sampleOrders) {
    const items = so.productIdx.map((idx) => allProducts[idx]).filter(Boolean);
    if (items.length === 0) continue;
    const subtotal = items.reduce((s, p) => s + (p.discountPrice ?? p.price), 0);
    const shipping = subtotal >= 50000 ? 0 : 2500;
    const total = subtotal + shipping;
    const createdAt = new Date(Date.now() - so.daysAgo * 86400000);
    const estDelivery = new Date(createdAt.getTime() + 4 * 86400000);
    const orderNumber = `RF-${createdAt.getTime().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const order = await db.order.create({
      data: {
        userId: demoUser.id,
        orderNumber,
        status: so.status,
        subtotal,
        shipping,
        discount: 0,
        total,
        shippingAddress: JSON.stringify({
          fullName: "Demo Shopper",
          phone: "+234 800 000 0000",
          street: "12 Adeola Odeku Street",
          city: "Lagos",
          state: "Lagos",
          country: "Nigeria",
        }),
        paymentMethod: "card",
        paymentStatus: "paid",
        estimatedDelivery: estDelivery,
        carrier: so.carrier,
        createdAt,
        items: {
          create: items.map((p) => ({
            productId: p.id,
            title: p.title,
            image: JSON.parse(p.images)[0] || "",
            price: p.discountPrice ?? p.price,
            quantity: 1,
          })),
        },
      },
    });

    // Create tracking events
    for (const ev of so.events) {
      await db.trackingEvent.create({
        data: {
          orderId: order.id,
          status: ev.status,
          note: ev.note,
          location: ev.location,
          createdAt: new Date(Date.now() - ev.hoursAgo * 3600000),
        },
      });
    }
  }

  console.log(`Seed complete. Categories: ${categories.length}, Products: ${products.length}`);
  console.log(`Demo user: ${demoUser.email}`);
  console.log(`Admin user: ${adminUser.email} (admin1234)`);
}

function slugFor(p: ProductDef): string {
  // Map product index to category slug
  const idx = products.indexOf(p);
  if (idx < 5) return "electronics";
  if (idx < 10) return "phones-tablets";
  if (idx < 15) return "fashion";
  if (idx < 20) return "home-kitchen";
  if (idx < 24) return "beauty-health";
  if (idx < 29) return "sports-outdoors";
  if (idx < 33) return "toys-games";
  return "groceries";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
