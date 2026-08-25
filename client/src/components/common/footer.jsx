import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTiktok, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import logo from '../../assets/LOGO!.png';
import QRCode from '../../assets/QR.png';
import EsewaLogo from '../../assets/Esewa_logo.webp';
import KhaltiLogo from '../../assets/khalti.png';
import FonepayLogo from '../../assets/fonepay.png';

const Footer = () => {
  return (
    <footer className="footer-gradient mt-auto border-t border-gold/20 text-white">
      <div className="mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Sunita'z Collection" className="h-20 w-auto object-contain" />
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
              Trendy fashion for the modern girl. Discover your perfect style.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li>
                <Link to="/" className="transition hover:text-gold-300">Home</Link>
              </li>
              <li>
                <Link to="/shop" className="transition hover:text-gold-300">Shop</Link>
              </li>
              <li>
                <Link to="/about" className="transition hover:text-gold-300">About Us</Link>
              </li>
              <li>
                <Link to="/messages" className="transition hover:text-gold-300">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-end text-right pr-4">
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">
              Contact Us
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-gold-400" /> support@sunitascollection.com
              </li>
              <li className="flex items-center gap-2">
                <FaPhoneAlt className="text-gold-400" /> +977-9800000000
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a href="https://www.facebook.com/share/1HUAXCsjZz/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 p-2 transition hover:border-gold-400 hover:bg-gold-500 hover:text-primary-900" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://www.instagram.com/sunita651562?igsh=ZDNyMmJ0MGtpMnM=" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 p-2 transition hover:border-gold-400 hover:bg-gold-500 hover:text-primary-900" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/30 p-2 transition hover:border-gold-400 hover:bg-gold-500 hover:text-primary-900" aria-label="TikTok">
                <FaTiktok />
              </a>
            </div>

            <div className="mt-6 flex flex-col items-end">
              <a href="https://www.tiktok.com/@sunitalamichhane27?_r=1&_t=ZS-98yy5adPc8O" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg bg-white p-1.5 shadow">
                <img src={QRCode} alt="Scan to follow us on TikTok" className="h-20 w-20 object-contain" />
              </a>
              <p className="mt-2 text-center text-xs font-medium text-white/80">Scan to follow us on TikTok</p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gold-300">We Accept</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <img src={EsewaLogo} alt="eSewa" className="h-10 w-auto object-contain" />
            <img src={KhaltiLogo} alt="Khalti" className="h-10 w-auto object-contain" />
            <img src={FonepayLogo} alt="FonePay" className="h-10 w-auto object-contain" />
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          &copy; {new Date().getFullYear()} All rights reserved. Trendy fashion for the modern girl.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
