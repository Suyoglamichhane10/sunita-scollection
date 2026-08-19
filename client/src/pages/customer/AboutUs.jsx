import React from 'react';
import { FaHeart, FaGem, FaUsers, FaLeaf, FaTruck, FaStar, FaShoppingBag, FaCrown } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GlamourAboutHero from '../../components/home/GlamourAboutHero';
import ProductSlideshow from '../../components/home/ProductSlideshow';
import QRCode from '../../assets/QR.png';

const AboutUs = () => {
  return (
    <div className="bg-cream text-ink">
      <GlamourAboutHero />

      {/* Full-width Trending Now - Long triangular banner shape */}
      <section className="relative w-full bg-cream px-0 pt-8 pb-12 lg:px-8">
        {/* Long triangular/trapezoid banner */}
        <div className="mx-auto max-w-7xl">
          <div
            className="about-triangular-banner relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-6 py-10 text-white shadow-luxury"
          >
            <div className="mb-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">Sunita&apos;z Collection</p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-white sm:text-3xl">Trending Now</h2>
              <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-white/80 sm:text-sm">
                Discover the latest styles everyone is talking about — from viral TikTok hits to timeless festive favorites.
              </p>
            </div>
            <div className="relative w-full overflow-hidden rounded-xl">
              <div className="aspect-[4/1] sm:aspect-[5/1]">
                <ProductSlideshow />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Story - Split Cards */}
      <section id="story" className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Our Journey</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">The Story Behind the Collection</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-white p-6 shadow-card transition hover:shadow-luxury">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-pink-100/50 blur-2xl transition group-hover:scale-150" />
            <div className="relative">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg">
                <FaCrown />
              </div>
              <h3 className="font-serif text-lg font-bold text-primary-800">How It Started</h3>
              <p className="mt-3 text-sm leading-6 text-ink-light">
                Sunita&apos;z Collection began with a simple dream: to make trendy, high-quality fashion accessible to every young woman in Nepal. What started as a small boutique with handpicked pieces has blossomed into a full e-commerce experience — but our heart still beats for personal service, genuine craftsmanship, and the joy of finding that perfect trendy outfit.
              </p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-white p-6 shadow-card transition hover:shadow-luxury">
            <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-gold-100/50 blur-2xl transition group-hover:scale-150" />
            <div className="relative">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg">
                <FaShoppingBag />
              </div>
              <h3 className="font-serif text-lg font-bold text-primary-800">Where We Are Now</h3>
              <p className="mt-3 text-sm leading-6 text-ink-light">
                Today, we serve style-forward girls and young women across Nepal with a growing catalogue of trendy tops, dresses, bottoms, footwear, and accessories. From TikTok trends to runway-inspired looks, every piece is chosen to make you feel confident, beautiful, and uniquely you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TikTok QR Code Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="order-2 lg:order-1 flex flex-col items-center text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Follow Us</p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 lg:text-3xl">
              Watch Our Product Videos on TikTok
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-light">
              Scan the QR code to instantly access our TikTok account and watch the latest product videos, styling tips, and behind-the-scenes content.
            </p>

            <div className="mt-4 rounded-2xl border border-gold/20 bg-white p-4 shadow-card">
              <h3 className="font-serif text-base font-bold text-primary-800 text-center">Contact Us</h3>
              <div className="mt-3 space-y-2 text-xs text-ink-light">
                <p className="text-center">
                  <span className="font-semibold text-primary-800">Address:</span> Bharatpur-10, Hospital Road, Chitwan
                </p>
                <p className="text-center">
                  <span className="font-semibold text-primary-800">Phone:</span>{' '}
                  <a href="tel:9768562128" className="text-primary-600 hover:underline">9768562128</a>,{' '}
                  <a href="tel:9845423800" className="text-primary-600 hover:underline">9845423800</a>
                </p>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center">
            <div className="rounded-2xl border border-gold/20 bg-white p-4 shadow-luxury text-center">
              <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center">
                <img
                  src={QRCode}
                  alt="Scan to watch our product videos on TikTok"
                  className="h-32 w-32 object-contain"
                />
              </a>
              <p className="mt-2 text-center text-xs font-semibold text-primary-800">
                Scan to watch our product videos on TikTok
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Highlights */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">What We Offer</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">Wear the Trend</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '👚', title: 'Trendy Tops', text: 'Crop tops, t-shirts, blouses & more — the foundation of every chic outfit.' },
            { icon: '👗', title: 'Chic Dresses', text: 'Mini, maxi, and bodycon dresses that turn heads everywhere you go.' },
            { icon: '👟', title: 'Stylish Footwear', text: 'Sneakers, heels, flats, sandals, and boots to complete your look.' },
            { icon: '👜', title: 'Fashion Accessories', text: 'Handbags, belts, sunglasses, scarves, and hats — the perfect finishing touches.' },
          ].map(({ icon, title, text }) => (
            <div key={title} className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-white p-5 shadow-card transition hover:shadow-luxury">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-pink-50/60 blur-xl transition group-hover:scale-125" />
              <div className="relative text-center">
                <span className="mb-3 block text-4xl drop-shadow">{icon}</span>
                <h3 className="font-serif text-base font-bold text-primary-800">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-ink-light">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section id="values" className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">What drives us</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">Our Values</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FaHeart, title: 'Passion for Fashion', text: 'We carefully curate every trendy piece, selecting styles that celebrate the modern young woman.' },
            { icon: FaGem, title: 'Quality First', text: 'Premium materials, attention to detail, and lasting craftsmanship in every product.' },
            { icon: FaUsers, title: 'Customer Love', text: 'Your satisfaction is our success. We listen, adapt, and strive to exceed expectations.' },
            { icon: FaLeaf, title: 'Ethical Sourcing', text: 'We work with trusted suppliers who share our commitment to fairness and sustainability.' },
            { icon: FaTruck, title: 'Reliable Delivery', text: 'Fast, trackable delivery across Nepal so you can enjoy your purchases sooner.' },
            { icon: FaStar, title: 'Trusted Experience', text: 'Transparent pricing, secure payments, and genuine care at every step.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-white p-5 shadow-card transition hover:shadow-luxury">
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-pink-50/60 blur-xl transition group-hover:scale-150" />
              <div className="relative">
                <Icon className="mb-3 text-2xl text-gold-500" />
                <h3 className="font-serif text-base font-bold text-primary-800">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-ink-light">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-6 py-10 text-center text-white shadow-luxury sm:px-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-serif text-2xl font-bold text-gold-200 sm:text-3xl">Be part of our story.</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-white/80">Explore our latest collection and find pieces that match your style and personality.</p>
            <Link to="/shop" className="btn-gold mt-4 inline-block rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg transition hover:scale-105 hover:shadow-xl">Shop the Collection</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
