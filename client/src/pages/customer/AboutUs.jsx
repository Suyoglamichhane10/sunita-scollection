import React, { useState, useEffect } from 'react';
import { FaHeart, FaGem, FaUsers, FaLeaf, FaTruck, FaStar, FaCrown, FaShoppingBag, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaFacebookF, FaInstagram, FaTiktok, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import GlamourAboutHero from '../../components/home/GlamourAboutHero';
import TrendingBanner from '../../components/home/TrendingBanner';
import QRCode from '../../assets/QR.png';
import OwnerImage from '../../assets/O.jpeg';

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

const values = [
  {
    icon: FaCrown,
    title: 'How It Started',
    text: 'I never planned a business. I just opened TikTok and posted whatever I wanted, with no strategy at all. Some videos did nothing, some did better than I expected, and slowly a real following built up until people were waiting to see what I posted next.',
  },
  {
    icon: FaShoppingBag,
    title: 'Where We Are Now',
    text: 'Sunita\'z Collection is now a growing name in Nepal\'s fashion scene, loved for its styles, its quality, and the personal touch I put into every piece. I film the new stuff, answer the messages and pack the orders myself.',
  },
];

const promises = [
  { icon: FaHeart, text: 'Styles picked by hand, not a warehouse list' },
  { icon: FaGem, text: 'Quality checked before it goes up' },
  { icon: FaUsers, text: 'A real person replies to your messages' },
  { icon: FaLeaf, text: 'Suppliers we have actually dealt with' },
  { icon: FaTruck, text: 'Delivery across Nepal you can track' },
  { icon: FaStar, text: 'Honest prices, secure payment' },
];

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
            <div className="order-2 flex flex-col items-center justify-center px-6 py-10 text-center lg:order-1 lg:px-10">
              <h3 className="font-serif text-2xl font-bold text-primary-800">
                <ContinuousTypewriter words={['Sunita Lamichhane']} speed={100} deleteSpeed={50} pause={2000} />
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold-600">Founder & Creative Head</p>
              <p className="mt-4 text-sm leading-7 text-ink-light">
                I run Sunita&apos;z Collection from Bharatpur. Most days that means filming,
                packing, replying to messages, and working out what is actually in stock
                before somebody orders it.
              </p>
              <p className="mt-3 text-sm leading-7 text-ink-light">
                I pick what goes up here myself. If a piece is not something I would wear,
                it does not go on the site. That is the whole idea behind it.
              </p>
              <p className="mt-3 text-sm leading-7 text-ink-light">
                I would rather tell you honestly that something is not in stock than take
                your order and let you wait. That is how I would want to be treated, so it
                is how I run this.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-primary-700"
                >
                  Follow on TikTok
                </a>
                <Link
                  to="/shop"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-primary-600 px-5 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
                >
                  Shop Now
                </Link>
              </div>
            </div>
            <div className="order-1 flex justify-center px-6 pb-10 lg:order-2 lg:px-10 lg:pb-0">
              <div className="moving-rect-border">
                <div className="moving-rect-border-inner h-72 w-full overflow-hidden rounded-2xl bg-gray-100 sm:h-80 lg:h-[28rem]">
                  <img
                    src={OwnerImage}
                    alt="Sunita Lamichhane, founder of Sunita'z Collection"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Started + How We Work, all in one card */}
      <section id="story" className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">Our Journey</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-primary-800 sm:text-3xl">The Story Behind the Collection</h2>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-luxury sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:gap-8">
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                {values.map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-white p-5 shadow-card transition hover:shadow-luxury"
                  >
                    <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-pink-50/60 blur-xl transition group-hover:scale-150" />
                    <div className="relative">
                      <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg">
                        <Icon className="text-sm" />
                      </div>
                      <h3 className="font-serif text-base font-bold text-primary-800">{title}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-ink-light">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <ul className="mt-5 grid gap-2.5 border-t border-gold/20 pt-5 sm:grid-cols-2" id="values">
                {promises.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-sm text-ink-light">
                    <Icon className="mt-0.5 shrink-0 text-gold-500" />
                    <span className="leading-6">{text}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-t border-gold/20 pt-4 text-sm leading-6 text-ink-light">
                Stock moves fast, so when something is gone I take it down rather than leave
                it sitting there. I quote you the real price before you pay anything, and you
                can pay cash on delivery, eSewa or FonePay. If it is not right, message me
                and we will sort it out.
              </p>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex justify-center overflow-hidden rounded-2xl bg-cream shadow-card">
                <img
                  src="/img/sister-full-700.webp"
                  alt="Sunita Lamichhane with her sisters, who help run Sunita'z Collection"
                  loading="lazy"
                  width="700"
                  height="1515"
                  className="h-auto max-h-[26rem] w-auto object-contain"
                />
              </div>
              <p className="mt-2.5 text-center text-xs text-ink-light">
                The people behind Sunita&apos;z Collection.
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
          <p className="mx-auto mt-2 max-w-2xl text-sm text-ink-light">
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-6 py-10 text-center text-white shadow-luxury sm:px-10">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-pink-500/20 blur-3xl" />
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
