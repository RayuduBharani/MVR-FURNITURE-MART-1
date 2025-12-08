"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { 
  Package, 
  Sofa, 
  ShoppingCart, 
  ClipboardList, 
  Banknote,
  BarChart3,
  Store,
  Search,
  Heart,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const features = [
  {
    name: "Stock & Products",
    icon: Package,
    href: "/stock",
    description: "Manage products, add stock, and track inventory efficiently",
  },
  {
    name: "Products Catalog",
    icon: Sofa,
    href: "/products",
    description: "View all products available in the shop",
  },
  {
    name: "Billing & Sales",
    icon: ShoppingCart,
    href: "/sales",
    description: "Create professional invoices and track all sales transactions",
  },
  {
    name: "Pending Bills",
    icon: ClipboardList,
    href: "/pending-bills",
    description: "Manage and track supplier pending payments easily",
  },
  {
    name: "Expenditures",
    icon: Banknote,
    href: "/expenditures",
    description: "Track all shop expenses and operational costs",
  },
  {
    name: "Monthly Reports",
    icon: BarChart3,
    href: "/reports",
    description: "View detailed financial reports and business analytics",
  },
];

const carouselItems = [
  {
    id: 1,
    title: "Transform Your Living Space",
    description: "Discover our curated collection of premium furniture designed to bring comfort and elegance to every corner of your home.",
    badge: "New Collection 2025",
    gradient: "from-gray-900 to-gray-800",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=600&fit=crop",
  },
  {
    id: 2,
    title: "Modern & Stylish Designs",
    description: "Explore contemporary furniture that combines functionality with stunning aesthetics for your modern home.",
    badge: "Trending Now",
    gradient: "from-blue-900 to-blue-800",
    image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1200&h=600&fit=crop",
  },
  {
    id: 3,
    title: "Comfort Meets Elegance",
    description: "Find the perfect pieces that match your lifestyle and interior design preferences with our extensive collection.",
    badge: "Premium Quality",
    gradient: "from-purple-900 to-purple-800",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=1200&h=600&fit=crop",
  },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const goToSlide = (index : number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500">
                <Sofa className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MVR Furniture Mart</h1>
                <p className="text-xs text-gray-500">Premium Furniture Shop</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-gray-700 font-medium hover:text-orange-500 transition">Home</a>
              <a href="#collections" className="text-gray-700 font-medium hover:text-orange-500 transition">Collections</a>
              <a href="#products" className="text-gray-700 font-medium hover:text-orange-500 transition">Products</a>
              <a href="#about" className="text-gray-700 font-medium hover:text-orange-500 transition">About</a>
              <a href="#contact" className="text-gray-700 font-medium hover:text-orange-500 transition">Contact</a>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Search className="w-5 h-5 text-gray-700" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Heart className="w-5 h-5 text-gray-700" />
              </button>
              <button className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition">
                Cart
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Carousel Section */}
      <section className="relative h-[500px] overflow-hidden">
        {/* Carousel Container */}
        <div className="relative h-full">
          {carouselItems.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${item.image}')`,
                }}
              />
              
              {/* Overlay Gradient */}
              <div className={`absolute inset-0 bg-linear-to-r ${item.gradient} opacity-60`} />
              <div className="absolute inset-0 bg-black/20" />

              {/* Content */}
              <div className="relative h-full flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <div className="max-w-2xl">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full mb-6 font-semibold text-sm animate-pulse">
                      <span className="w-2 h-2 bg-white rounded-full" />
                      {item.badge}
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                      {item.title}
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-gray-100 mb-8 max-w-xl drop-shadow-md">
                      {item.description}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition transform hover:scale-105 shadow-lg">
                        Explore Collection
                      </button>
                      <button className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-lg">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition group"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition group"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-orange-500 w-8"
                  : "bg-white/50 w-3 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Shop by Category Section */}
      <section id="collections" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Shop by Category</h2>
            <p className="text-gray-600 text-lg">Find the perfect furniture for every room</p>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link key={feature.name} href={feature.href}>
                  <Card className="group h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
                    <CardContent className="p-0">
                      {/* Icon Background */}
                      <div className="h-40 bg-linear-to-br from-orange-100 to-orange-50 flex items-center justify-center group-hover:from-orange-200 group-hover:to-orange-100 transition">
                        <Icon className="w-16 h-16 text-orange-500" />
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition">
                          {feature.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          {feature.description}
                        </p>
                        <div className="flex items-center text-orange-500 font-semibold text-sm">
                          Visit <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="products" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full">
                  <Package className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Wide Selection</h3>
              <p className="text-gray-600">Explore hundreds of premium furniture pieces for every style and budget</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full">
                  <ShoppingCart className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Easy Shopping</h3>
              <p className="text-gray-600">Seamless checkout process with multiple payment options</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full">
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Best Prices</h3>
              <p className="text-gray-600">Competitive pricing with regular discounts and special offers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-orange-500">
                  <Store className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">MVR Furniture</span>
              </div>
              <p className="text-sm">Premium furniture for your home</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">All Furniture</a></li>
                <li><a href="#" className="hover:text-white transition">New Arrivals</a></li>
                <li><a href="#" className="hover:text-white transition">Sales</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm">© 2025 MVR Furniture Mart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}