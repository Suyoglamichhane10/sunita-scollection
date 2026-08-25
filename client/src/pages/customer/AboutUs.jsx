import React, { useState, useEffect } from 'react';
import { FaHeart, FaGem, FaUsers, FaLeaf, FaTruck, FaStar, FaShoppingBag, FaCrown, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaFacebookF, FaInstagram, FaTiktok, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GlamourAboutHero from '../../components/home/GlamourAboutHero';
import TrendingBanner from '../../components/home/TrendingBanner';
import ownerPhoto from '../../assets/sunu.jpg';
import QRCode from '../../assets/QR.png';

const ContinuousTypewriter = ({ words = [], speed = 100, deleteSpeed = 60, pause = 1500, className = '' }) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting && displayed === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), pause);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(
      () => {
        if (isDeleting) {
          setDisplayed((prev) => prev.slice(0, -1));
        } else {
          setDisplayed((prev) => prev + currentWord[prev.length]);
        }
      },
      isDeleting ? deleteSpeed : speed
    );

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex, words, speed, deleteSpeed, pause]);

  return (
    <span className={className}>
      {displayed}
      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary-800 align-middle sm:h-5 sm:w-1" />
    </span>
  );
};

const AboutUs = () => {
  return (
    <div className="bg-cream text-ink">
      <GlamourAboutHero />

      {/* Full-width Trending Now */}
      <section className="relative w-full bg-cream px-0 pt-8 pb-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-2xl bg-white px-6 py-10 shadow-luxury">
            <div className="mb-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Sunita&apos;z Collection</p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">
                <ContinuousTypewriter words={['Trending Now']} speed={120} />
              </h2>
              <p className="mx-auto mt-1 max-w-2xl text-xs leading-6 text-ink-light sm:text-sm">
                Discover the latest styles everyone is talking about — from viral TikTok hits to timeless festive favorites.
              </p>
            </div>
            <div className="relative w-full overflow-hidden rounded-xl">
              <TrendingBanner endpoint="/products/featured?type=trending&limit=12" interval={3000} />
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Owner */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Meet the Owner</p>
        </div>
        <div className="moving-rect-border">
          <div className="moving-rect-border-inner grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center lg:px-10 order-2 lg:order-1">
              <h3 className="font-serif text-2xl font-bold text-primary-800">
                <ContinuousTypewriter words={['Sunita Lamichhane']} speed={100} deleteSpeed={50} pause={2000} />
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold-600">Founder & Creative Head</p>
              <p className="mt-4 text-sm leading-7 text-ink-light">
                Sunita&apos;z Collection is driven by one person&apos;s passion for fashion and her dream to make trendy, high-quality clothing accessible to every young woman in Nepal. From selecting the latest trends to ensuring every piece meets her standards, Sunita is personally involved in every step.
              </p>
              <p className="mt-3 text-sm leading-7 text-ink-light">
                With an eye for what looks good and feels great, she curates styles that celebrate confidence, comfort, and individuality — because every girl deserves to feel beautiful in what she wears.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-primary-700"
                >
                  Follow on TikTok
                </a>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
                >
                  Shop Now
                </Link>
              </div>
            </div>
            <div className="flex justify-center px-6 pb-10 lg:px-10 lg:pb-0 order-1 lg:order-2">
              <div className="moving-rect-border">
                <div className="moving-rect-border-inner overflow-hidden rounded-2xl bg-gray-100 h-72 sm:h-80 lg:h-[28rem] w-full">
                  <img
                    src={ownerPhoto}
                    alt="Sunita Lamichhane - Owner"
                    className="h-full w-full object-cover"
                  />
                </div>
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

      {/* Contact Us Section */}
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Get in Touch</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">
            <ContinuousTypewriter words={['Contact Us']} speed={120} />
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-ink-light">
            Have a question, need styling advice, or want to place a bulk order? We would love to hear from you.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Contact Info Card */}
          <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-card lg:col-span-1">
            <h3 className="font-serif text-lg font-bold text-primary-800 text-center">Contact Information</h3>
            <div className="mt-5 space-y-4 text-sm text-ink-light">
              <p className="flex items-start gap-3">
                <FaMapMarkerAlt className="mt-0.5 text-gold-500" />
                <span>Bharatpur-10, Hospital Road, Chitwan</span>
              </p>
              <p className="flex items-start gap-3">
                <FaPhoneAlt className="mt-0.5 text-gold-500" />
                <span>
                  <a href="tel:9768562128" className="text-primary-600 hover:underline">9768562128</a>,{' '}
                  <a href="tel:9845423800" className="text-primary-600 hover:underline">9845423800</a>
                </span>
              </p>
              <p className="flex items-start gap-3">
                <FaEnvelope className="mt-0.5 text-gold-500" />
                <span>support@sunitascollection.com</span>
              </p>
              <p className="flex items-start gap-3">
                <FaClock className="mt-0.5 text-gold-500" />
                <span>Sun – Fri: 10:00 AM – 7:00 PM<br />Saturday: Closed</span>
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <a href="https://www.facebook.com/sunitascollection" target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 p-2.5 text-ink-light transition hover:border-gold-400 hover:text-primary" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://www.instagram.com/sunitascollection" target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 p-2.5 text-ink-light transition hover:border-gold-400 hover:text-primary" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 p-2.5 text-ink-light transition hover:border-gold-400 hover:text-primary" aria-label="TikTok">
                <FaTiktok />
              </a>
            </div>
          </div>

          {/* TikTok QR Code */}
          <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-card lg:col-span-1 flex flex-col items-center justify-center text-center">
            <h3 className="font-serif text-lg font-bold text-primary-800">Follow Us on TikTok</h3>
            <p className="mt-2 text-sm text-ink-light">Scan to watch our product videos, styling tips, and behind-the-scenes content.</p>
            <div className="mt-4 rounded-2xl border border-gold/20 bg-gray-50 p-4 shadow-sm">
              <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center">
                <img src={QRCode} alt="Scan to watch our product videos on TikTok" className="h-40 w-40 object-contain" />
              </a>
            </div>
            <p className="mt-3 text-xs font-semibold text-primary-800">Scan with your phone camera</p>
          </div>

          {/* Quick Message Card */}
          <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-card lg:col-span-1">
            <h3 className="font-serif text-lg font-bold text-primary-800 text-center">Quick Message</h3>
            <p className="mt-2 text-sm text-ink-light text-center">Prefer to message us directly? Reach out anytime.</p>
            <div className="mt-4 space-y-3">
              <a href="tel:9768562128" className="flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-primary-700">
                <FaPhoneAlt /> Call Now
              </a>
              <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full border-2 border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50">
                <FaTiktok /> Chat on TikTok
              </a>
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
