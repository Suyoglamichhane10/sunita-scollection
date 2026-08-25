import React, { useState, useEffect } from 'react';
import { FaPhoneAlt, FaMapMarkerAlt, FaFacebookF, FaInstagram, FaTiktok, FaPaperPlane, FaClock, FaStar, FaTruck, FaRuler, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../Services/api';
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

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/messages', { ...form, source: 'website' });
      toast.success('Message sent successfully! We will get back to you soon.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-cream text-ink">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-6 py-20 text-white lg:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-pink-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-gold-300">Get in Touch</p>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            <ContinuousTypewriter words={['Contact Us', 'Let\'s Talk', 'We\'re Here']} speed={100} deleteSpeed={60} pause={1800} />
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
            Have a question, need styling advice, or want to place a bulk order? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-2xl border border-gold/20 bg-white p-6 text-center shadow-card transition hover:shadow-luxury">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg transition group-hover:scale-110">
              <FaPhoneAlt className="text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-800">Call Us</h3>
            <p className="mt-2 text-sm text-ink-light">Instant support</p>
            <div className="mt-3 space-y-1 text-sm">
              <a href="tel:9768562128" className="block text-primary-600 hover:underline">9768562128</a>
              <a href="tel:9845423800" className="block text-primary-600 hover:underline">9845423800</a>
            </div>
          </div>

          <div className="group rounded-2xl border border-gold/20 bg-white p-6 text-center shadow-card transition hover:shadow-luxury">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-lg transition group-hover:scale-110">
              <FaMapMarkerAlt className="text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-800">Visit Us</h3>
            <p className="mt-2 text-sm text-ink-light">Our store location</p>
            <p className="mt-3 text-sm font-medium text-ink">Bharatpur-10, Hospital Road, Chitwan</p>
          </div>

          <div className="group rounded-2xl border border-gold/20 bg-white p-6 text-center shadow-card transition hover:shadow-luxury">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg transition group-hover:scale-110">
              <FaTiktok className="text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-800">TikTok Shop</h3>
            <p className="mt-2 text-sm text-ink-light">Watch & order</p>
            <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-full bg-primary-600 px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105 hover:bg-primary-700">
              Follow Now
            </a>
          </div>

          <div className="group rounded-2xl border border-gold/20 bg-white p-6 text-center shadow-card transition hover:shadow-luxury">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg transition group-hover:scale-110">
              <FaClock className="text-xl" />
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-800">Open Hours</h3>
            <p className="mt-2 text-sm text-ink-light">When we are available</p>
            <div className="mt-3 space-y-1 text-sm text-ink">
              <p>Sun – Fri: 10 AM – 7 PM</p>
              <p>Saturday: Closed</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* Message */}
            <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-card">
              <h3 className="font-serif text-lg font-bold text-primary-800 text-center">Why Contact Us?</h3>
              <div className="mt-4 space-y-3 text-sm text-ink-light">
                <p className="flex items-start gap-3">
                  <FaStar className="mt-0.5 text-gold-500" />
                  <span>Personal styling advice for any occasion — casual, festive, or office wear.</span>
                </p>
                <p className="flex items-start gap-3">
                  <FaRuler className="mt-0.5 text-gold-500" />
                  <span>Need the perfect fit? Ask about sizing, alterations, and custom styling.</span>
                </p>
                <p className="flex items-start gap-3">
                  <FaUsers className="mt-0.5 text-gold-500" />
                  <span>Planning a bulk order for events, groups, or resale? We offer special pricing.</span>
                </p>
                <p className="flex items-start gap-3">
                  <FaTruck className="mt-0.5 text-gold-500" />
                  <span>Delivery inquiries, exchange requests, or order tracking help.</span>
                </p>
              </div>
            </div>

            {/* Social & QR */}
            <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-card">
              <h3 className="font-serif text-lg font-bold text-primary-800 text-center">Follow Us</h3>
              <p className="mt-2 text-center text-sm text-ink-light">Stay updated with our latest collections and offers.</p>
              <div className="mt-4 flex justify-center gap-3">
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
              <div className="mt-6 rounded-2xl border border-gold/20 bg-gray-50 p-4 text-center shadow-sm">
                <p className="text-sm font-semibold text-primary-800">Scan for TikTok Videos</p>
                <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center justify-center">
                  <img src={QRCode} alt="Scan to watch our product videos on TikTok" className="h-36 w-36 object-contain" />
                </a>
                <p className="mt-2 text-xs text-ink-light">Scan with phone camera</p>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-gold/20 bg-white p-6 shadow-card sm:p-8">
              <div className="mb-6 text-center">
                <h3 className="font-serif text-2xl font-bold text-primary-800">Send Us a Message</h3>
                <p className="mt-1 text-sm text-ink-light">Fill out the form and we will respond as soon as possible.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Full name</label>
                    <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="+977-98XXXXXXXX" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Subject</label>
                    <select name="subject" value={form.subject} onChange={handleChange} required className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10">
                      <option value="">Select a topic</option>
                      <option value="Order Inquiry">Order Inquiry</option>
                      <option value="Sizing Help">Sizing Help</option>
                      <option value="Bulk Order">Bulk Order</option>
                      <option value="Delivery Issue">Delivery Issue</option>
                      <option value="Exchange / Return">Exchange / Return</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required rows="5" className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="Tell us more..." />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button type="submit" disabled={sending} className="btn-elegant inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300">
                    <FaPaperPlane /> {sending ? 'Sending...' : 'Send Message'}
                  </button>
                  <p className="text-xs text-ink-light">We usually reply within a few hours.</p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
