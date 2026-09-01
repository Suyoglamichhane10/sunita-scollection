import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import aboutImage from '../../assets/Aboutimage.png';

const Sparkle = ({ delay, left, top, size, color = '#fbbf24' }) => (
  <motion.span
    className="absolute"
    style={{ left, top, fontSize: size, color }}
    initial={{ opacity: 0, scale: 0, rotate: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], rotate: [0, 180, 360] }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    ✦
  </motion.span>
);

const HeartParticle = ({ delay, left }) => (
  <motion.span
    className="absolute text-pink-300"
    style={{ left, bottom: '5%', fontSize: '16px' }}
    initial={{ opacity: 0, y: 0, scale: 0.5 }}
    animate={{ opacity: [0, 1, 0], y: [0, -80, -160], scale: [0.5, 1, 0.5] }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  >
    ♥
  </motion.span>
);

const RoseParticle = ({ delay, left }) => (
  <motion.span
    className="absolute text-rose-300"
    style={{ left, bottom: '8%', fontSize: '18px' }}
    initial={{ opacity: 0, y: 0, rotate: 0 }}
    animate={{ opacity: [0, 0.9, 0], y: [0, -60, -140], rotate: [0, 180, 360] }}
    transition={{
      duration: 5,
      delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  >
    🌹
  </motion.span>
);

const GlamourAboutHero = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="glamour-about-hero relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Full background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${aboutImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      {/* Animated luxury orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold-400/20 blur-3xl"
          animate={{ x: [0, 80, 0], y: [0, 60, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-pink-500/20 blur-3xl"
          animate={{ x: [0, -70, 0], y: [0, -60, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-rose-400/20 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-10 left-1/2 h-64 w-64 rounded-full bg-gold-300/10 blur-3xl"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Sparkles and hearts */}
      {[
        { delay: 0, left: '8%', top: '12%', size: '20px' },
        { delay: 0.7, left: '88%', top: '18%', size: '16px' },
        { delay: 1.4, left: '78%', top: '72%', size: '22px' },
        { delay: 2.1, left: '12%', top: '78%', size: '18px' },
        { delay: 2.8, left: '52%', top: '6%', size: '14px' },
        { delay: 3.5, left: '92%', top: '48%', size: '20px' },
        { delay: 0.4, left: '6%', top: '42%', size: '16px' },
        { delay: 1.1, left: '62%', top: '88%', size: '18px' },
        { delay: 1.8, left: '35%', top: '92%', size: '14px' },
        { delay: 2.5, left: '45%', top: '15%', size: '16px' },
      ].map((sp, i) => (
        <Sparkle key={i} {...sp} />
      ))}

      {[0, 1.5, 3, 4.5].map((d, i) => (
        <HeartParticle key={`h-${i}`} delay={d} left={`${18 + i * 20}%`} />
      ))}
      {[0.8, 2.3, 3.8, 5.3].map((d, i) => (
        <RoseParticle key={`r-${i}`} delay={d} left={`${12 + i * 22}%`} />
      ))}

      {/* Centered text content */}
      <div className="relative z-10 max-w-4xl px-6 text-center">
        <motion.p
          className="mb-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-gold-300 sm:text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="text-gold-400">◆</span>
          Sunita&apos;z Collection
        </motion.p>

        <motion.h1
          className="font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl"
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          About Us
        </motion.h1>

        <motion.p
          className="mx-auto mt-4 text-sm leading-7 text-white/90 sm:text-base"
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          Built with love by Sunita Lamichhane — a Nepali brand growing with heart, style, and a promise to look good while doing good.
        </motion.p>

        <motion.div
          className="mt-6 flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.65, duration: 0.6 }}
        >
          <a
            href="#story"
            className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-2.5 text-sm font-semibold text-primary-900 shadow-lg transition hover:scale-105 hover:bg-gold-400 hover:shadow-xl"
          >
            ✦ Discover Our Story
          </a>
          <a
            href="#values"
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:scale-105 hover:bg-white/10"
          >
            Our Values
          </a>
        </motion.div>
      </div>

      {/* Bottom triangle transition */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg
          className="h-16 w-full text-cream"
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};

export default GlamourAboutHero;
