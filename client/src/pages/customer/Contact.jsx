import React, { useState } from 'react';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, FaFacebookF, FaInstagram, FaTiktok, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../Services/api';
import QRCode from '../../assets/QR.png';

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
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-6 py-16 text-white lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-gold-300">Get in Touch</p>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
            Have a question, need styling advice, or want to place a bulk order? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Info */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-card">
              <h3 className="font-serif text-lg font-bold text-primary-800 text-center">Contact Information</h3>
              <div className="mt-4 space-y-4 text-sm text-ink-light">
                <p className="flex items-start gap-3">
                  <FaEnvelope className="mt-0.5 text-gold-500" />
                  <span>support@sunitascollection.com</span>
                </p>
                <p className="flex items-start gap-3">
                  <FaPhoneAlt className="mt-0.5 text-gold-500" />
                  <span>+977-9800000000</span>
                </p>
                <p className="flex items-start gap-3">
                  <FaMapMarkerAlt className="mt-0.5 text-gold-500" />
                  <span>Kathmandu, Nepal</span>
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

              <div className="mt-6 rounded-2xl border border-gold/20 bg-white p-6 text-center shadow-lg">
                <p className="text-sm font-semibold text-primary-800">Scan to watch our product videos on TikTok</p>
                <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center justify-center rounded-2xl bg-gray-50 p-3 shadow-sm">
                  <img src={QRCode} alt="Scan to watch our product videos on TikTok" className="h-48 w-48 object-contain" />
                </a>
                <p className="mt-3 text-xs text-ink-light">Scan with your phone camera or tap to open TikTok</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gold/20 bg-white p-6 shadow-card">
              <h3 className="font-serif text-lg font-bold text-primary-800">Business Hours</h3>
              <div className="mt-4 space-y-2 text-sm text-ink-light">
                <p>Sunday – Friday: 10:00 AM – 7:00 PM</p>
                <p>Saturday: Closed</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-gold/20 bg-white p-6 shadow-card sm:p-8">
              <h3 className="font-serif text-xl font-bold text-primary-800">Send Us a Message</h3>
              <p className="mt-1 text-sm text-ink-light">Fill out the form and we will respond as soon as possible.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Full name</label>
                    <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="you@example.com" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="+977-98XXXXXXXX" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Subject</label>
                    <input name="subject" value={form.subject} onChange={handleChange} required className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="How can we help?" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required rows="5" className="w-full rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" placeholder="Tell us more..." />
                </div>
                <button type="submit" disabled={sending} className="btn-elegant inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300">
                  <FaPaperPlane /> {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
