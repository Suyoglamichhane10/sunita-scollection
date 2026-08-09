import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaEnvelope, FaPhoneAlt, FaGem } from 'react-icons/fa';

const Footer = () => {
  return (
<footer className="footer-gradient mt-auto border-t border-gold/20 text-white">
      <div className="mx-auto px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-gradient-to-br from-gold-400 to-gold-600 p-2 text-primary-900">
                <FaGem />
              </div>
              <h3 className="font-serif text-xl font-bold">
                Sunita's <span className="text-gold-gradient">Collection</span>
              </h3>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/70">
              Elegance for every woman. Explore women's fashion, accessories, and elegant pieces made for every occasion.
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
          <div>
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
              <a href="#" className="rounded-full border border-white/30 p-2 transition hover:border-gold-400 hover:bg-gold-500 hover:text-primary-900" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="#" className="rounded-full border border-white/30 p-2 transition hover:border-gold-400 hover:bg-gold-500 hover:text-primary-900" aria-label="Instagram">
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          &copy; {new Date().getFullYear()} Sunita's Collection. All rights reserved. Elegance for every woman.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
