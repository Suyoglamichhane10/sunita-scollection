import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Sparkle = ({ delay, left, top, size }) => (
  <motion.span
    className="absolute text-gold-400"
    style={{ left, top, fontSize: size }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
    transition={{
      duration: 2.5,
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
    className="absolute text-pink-400"
    style={{ left, bottom: '10%', fontSize: '14px' }}
    initial={{ opacity: 0, y: 0 }}
    animate={{ opacity: [0, 1, 0], y: [0, -60, -120] }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  >
    ♥
  </motion.span>
);

const AnimatedGirlHero = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-6 py-16 text-white lg:py-24">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-pink-400/20 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-primary-400/20 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={mounted ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <motion.p
              className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-gold-300 sm:text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="text-gold-400">◆</span>
              Sunita'z Collection
            </motion.p>

            <motion.h1
              className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 30 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35, duration: 0.7 }}
            >
              About Us
            </motion.h1>

            <motion.p
              className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/90 sm:text-lg lg:mx-0"
              initial={{ opacity: 0, y: 30 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              Where tradition meets contemporary style. We are here to celebrate every woman with elegance, grace, and fashion that tells your story.
            </motion.p>

            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.65, duration: 0.6 }}
            >
              <a
                href="#story"
                className="inline-block rounded-full bg-gold-500 px-8 py-3.5 font-semibold text-primary-900 shadow-lg transition hover:scale-105 hover:bg-gold-400 hover:shadow-xl"
              >
                Discover Our Story
              </a>
            </motion.div>
          </motion.div>

          {/* Animated Girl Illustration */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={mounted ? { opacity: 1, scale: 1, rotate: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="relative">
              {/* Floating rings behind the figure */}
              <motion.div
                className="absolute -inset-10 rounded-full border-2 border-gold-300/30"
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute -inset-16 rounded-full border border-gold-200/20"
                animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />

              {/* Sparkles */}
              {[
                { delay: 0, left: '10%', top: '15%', size: '18px' },
                { delay: 0.6, left: '85%', top: '20%', size: '14px' },
                { delay: 1.2, left: '75%', top: '70%', size: '20px' },
                { delay: 1.8, left: '15%', top: '75%', size: '16px' },
                { delay: 2.4, left: '50%', top: '5%', size: '12px' },
                { delay: 3, left: '90%', top: '50%', size: '18px' },
                { delay: 0.9, left: '5%', top: '45%', size: '14px' },
                { delay: 1.5, left: '60%', top: '85%', size: '16px' },
              ].map((sp, i) => (
                <Sparkle key={i} {...sp} />
              ))}

              {/* Hearts floating up */}
              {[0, 1.2, 2.4, 3.6].map((d, i) => (
                <HeartParticle key={i} delay={d} left={`${20 + i * 18}%`} />
              ))}

              {/* Main figure - elegant girl silhouette */}
              <motion.div
                className="relative"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg
                  viewBox="0 0 400 500"
                  className="h-64 w-56 drop-shadow-2xl sm:h-80 sm:w-64 lg:h-96 lg:w-80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Glow effect */}
                  <defs>
                    <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde4cf" />
                      <stop offset="100%" stopColor="#f5c4a1" />
                    </linearGradient>
                    <linearGradient id="dressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="50%" stopColor="#db2777" />
                      <stop offset="100%" stopColor="#be185d" />
                    </linearGradient>
                    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3f2216" />
                      <stop offset="100%" stopColor="#1a0f0a" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Dress / Body */}
                  <motion.path
                    d="M200 160 
                       C 240 160, 260 200, 260 240
                       C 260 300, 250 360, 240 420
                       L 240 480
                       L 160 480
                       L 160 420
                       C 150 360, 140 300, 140 240
                       C 140 200, 160 160, 200 160 Z"
                    fill="url(#dressGrad)"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={mounted ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.8, delay: 0.5, ease: 'easeInOut' }}
                  />

                  {/* Dress detail - waist belt */}
                  <motion.rect
                    x="155"
                    y="230"
                    width="90"
                    height="12"
                    rx="6"
                    fill="#fbbf24"
                    initial={{ scaleX: 0 }}
                    animate={mounted ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.6, delay: 1.2 }}
                  />

                  {/* Neck */}
                  <motion.rect
                    x="190"
                    y="140"
                    width="20"
                    height="25"
                    rx="10"
                    fill="url(#skinGrad)"
                    initial={{ opacity: 0 }}
                    animate={mounted ? { opacity: 1 } : {}}
                    transition={{ delay: 0.8 }}
                  />

                  {/* Head */}
                  <motion.circle
                    cx="200"
                    cy="120"
                    r="45"
                    fill="url(#skinGrad)"
                    initial={{ scale: 0 }}
                    animate={mounted ? { scale: 1 } : {}}
                    transition={{ duration: 0.7, delay: 0.3, type: 'spring' }}
                  />

                  {/* Hair - flowing */}
                  <motion.path
                    d="M155 100
                       C 155 60, 170 40, 200 40
                       C 230 40, 245 60, 245 100
                       C 245 130, 250 160, 255 200
                       C 250 210, 245 200, 240 180
                       C 235 160, 230 150, 225 160
                       C 220 170, 215 160, 210 150
                       C 200 140, 190 140, 180 150
                       C 175 160, 170 170, 165 160
                       C 160 150, 155 160, 150 180
                       C 145 200, 140 210, 145 200
                       C 150 160, 155 130, 155 100 Z"
                    fill="url(#hairGrad)"
                    initial={{ pathLength: 0 }}
                    animate={mounted ? { pathLength: 1 } : {}}
                    transition={{ duration: 2, delay: 0.6, ease: 'easeInOut' }}
                  />

                  {/* Face features - eyes */}
                  <motion.g initial={{ opacity: 0 }} animate={mounted ? { opacity: 1 } : {}} transition={{ delay: 1 }}>
                    <ellipse cx="185" cy="115" rx="5" ry="3" fill="#1a0f0a" />
                    <ellipse cx="215" cy="115" rx="5" ry="3" fill="#1a0f0a" />
                    {/* Smile */}
                    <motion.path
                      d="M190 130 Q200 138 210 130"
                      stroke="#c97b6b"
                      strokeWidth="2.5"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={mounted ? { pathLength: 1 } : {}}
                      transition={{ duration: 0.8, delay: 1.4 }}
                    />
                    {/* Blush */}
                    <circle cx="180" cy="125" r="6" fill="#f9a8d4" opacity="0.5" />
                    <circle cx="220" cy="125" r="6" fill="#f9a8d4" opacity="0.5" />
                  </motion.g>

                  {/* Arms */}
                  <motion.path
                    d="M160 200 C 130 220, 120 260, 125 280"
                    stroke="url(#skinGrad)"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={mounted ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.2, delay: 0.9 }}
                  />
                  <motion.path
                    d="M240 200 C 270 220, 280 260, 275 280"
                    stroke="url(#skinGrad)"
                    strokeWidth="14"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={mounted ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.2, delay: 1 }}
                  />

                  {/* Hands */}
                  <motion.circle
                    cx="125"
                    cy="285"
                    r="10"
                    fill="url(#skinGrad)"
                    initial={{ scale: 0 }}
                    animate={mounted ? { scale: 1 } : {}}
                    transition={{ delay: 1.5 }}
                  />
                  <motion.circle
                    cx="275"
                    cy="285"
                    r="10"
                    fill="url(#skinGrad)"
                    initial={{ scale: 0 }}
                    animate={mounted ? { scale: 1 } : {}}
                    transition={{ delay: 1.6 }}
                  />

                  {/* Earrings */}
                  <motion.circle
                    cx="155"
                    cy="120"
                    r="4"
                    fill="#fbbf24"
                    initial={{ scale: 0 }}
                    animate={mounted ? { scale: [0, 1.4, 1] } : {}}
                    transition={{ delay: 1.7, duration: 0.5 }}
                  />
                  <motion.circle
                    cx="245"
                    cy="120"
                    r="4"
                    fill="#fbbf24"
                    initial={{ scale: 0 }}
                    animate={mounted ? { scale: [0, 1.4, 1] } : {}}
                    transition={{ delay: 1.8, duration: 0.5 }}
                  />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedGirlHero;
