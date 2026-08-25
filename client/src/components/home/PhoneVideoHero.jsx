import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import sunuImage from '../../assets/sunu.jpg';
import logoImage from '../../assets/LOGO!.png';
import girlsImage from '../../assets/girl collection.jpg';

const SCENE_DURATION = 5000;

const voiceLines = [
  'नमस्ते! म Sunita हुँ। TikTok बाट चिन्नुहुने म सित्तैमा तपाईंलाई हाम्रो वेबसाइटमा स्वागत गर्दछु!',
  'TikTok बाट सकियो! अब हाम्रो आधिकारिक वेबसाइट www.sunitazcollection.com मा आउनुहोस्।',
  'पहिले नयाँ खाता खोल्नुहोस् वा लग इन गर्नुहोस्।',
  'यो हो हाम्रो होमपेज। सारी, झुम्का, झोला, र चप्पलहरू छन्।',
  'Girls Collection मा क्लिक गर्नुहोस् र तपाईंको पसंदीदा आइटम चयन गर्नुहोस्।',
  'यो क्लासिक ब्ल्याक ह्यान्डब्याग हो। साइज १XL, मूल्य रु. १,१५०।',
  'कार्टमा थप्नुहोस् र पुनः बुझाउनुहोस्।',
  'अब डेलिभरी ठेगाना र eSewa बाट भुक्तानी गर्नुहोस्।',
  'भुक्तानी सफल भयो! अर्डर कन्फर्म भयो र डेलिभरी समय दिइएको छ।',
  'धन्यवाद! अहिले नै www.sunitazcollection.com मा भिजिट गर्नुहोस्।',
];

const useVoiceover = () => {
  const [speaking, setSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const speak = useCallback((text, index) => {
    if (!enabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ne-NP';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      setSpeaking(true);
      setCurrentIndex(index);
    };
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [enabled]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speaking, enabled, setEnabled, speak, currentIndex };
};

const StatusBar = () => (
  <div className="flex items-center justify-between px-6 pt-3 pb-1 text-white">
    <span className="text-xs font-semibold">9:41</span>
    <div className="flex items-center gap-1">
      <div className="h-2.5 w-4 rounded-[1px] bg-white" />
      <div className="h-2 w-2.5 rounded-[1px] bg-white" />
      <div className="h-3 w-6 rounded-[2px] bg-white" />
    </div>
  </div>
);

const DynamicIsland = () => (
  <div className="absolute left-1/2 top-3 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
);

const LockScene = ({ onUnlock }) => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-b from-blue-400 to-purple-600"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <StatusBar />
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.div
        className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white/70 shadow-2xl"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <img src={sunuImage} alt="Sunita" className="h-full w-full object-cover" />
      </motion.div>
      <motion.h3 className="font-serif text-xl font-bold text-white drop-shadow-lg">नमस्ते! म Sunita हुँ।</motion.h3>
      <motion.p className="mt-2 text-xs leading-5 text-white/90">Tap to start tutorial</motion.p>
    </div>
    <motion.button
      onClick={onUnlock}
      className="absolute bottom-10 left-1/2 z-20 h-1 w-32 -translate-x-1/2 rounded-full bg-white/60"
      whileTap={{ scale: 0.9 }}
    />
  </motion.div>
);

const SafariScene = ({ onNext }) => (
  <motion.div
    className="absolute inset-0 bg-white"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
      <div className="flex-1 rounded-full bg-gray-100 px-3 py-1.5">
        <p className="text-[10px] text-gray-600">www.sunitazcollection.com</p>
      </div>
    </div>
    <div className="relative h-full bg-gradient-to-b from-primary-50 to-white">
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <motion.div className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-lg">
          <img src={logoImage} alt="Logo" className="h-full w-full object-contain p-2" />
        </motion.div>
        <motion.h3 className="mt-3 font-serif text-lg font-bold text-primary-800">Sunita&apos;z Collection</motion.h3>
        <p className="mt-1 text-xs text-ink-light">TikTok → Official Website</p>
        <motion.button
          onClick={onNext}
          className="mt-4 rounded-full bg-primary-700 px-6 py-2 text-xs font-semibold text-white shadow-md"
          whileTap={{ scale: 0.95 }}
        >
          Enter Website
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const LoginScene = ({ onNext }) => (
  <motion.div
    className="absolute inset-0 bg-gray-50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
      <span className="text-sm font-semibold text-primary-800">Login / Register</span>
    </div>
    <div className="flex flex-col px-5 py-6">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="mb-1 block text-xs font-semibold text-gray-600">Email</label>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
          <p className="text-xs text-gray-500">customer@example.com</p>
        </div>
        <label className="mb-1 mt-3 block text-xs font-semibold text-gray-600">Password</label>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
          <p className="text-xs text-gray-500">••••••••</p>
        </div>
        <motion.button
          onClick={onNext}
          className="mt-4 w-full rounded-full bg-primary-700 py-2.5 text-sm font-semibold text-white shadow-md"
          whileTap={{ scale: 0.97 }}
        >
          Login
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const HomepageScene = ({ onNext }) => (
  <motion.div
    className="absolute inset-0 bg-gray-50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
      <span className="text-sm font-bold text-primary-800">Home</span>
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-gray-200" />
      </div>
    </div>
    <div className="px-4 py-3">
      <div className="h-40 rounded-2xl bg-gradient-to-r from-primary-700 to-primary-900 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-300">New Arrivals</p>
        <h4 className="mt-1 font-serif text-sm font-bold text-white">Girls Collection</h4>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-2 shadow-sm">
          <div className="h-16 rounded-lg bg-gray-200" />
          <p className="mt-1 text-[10px] font-semibold text-primary-800">Sarees</p>
        </div>
        <div className="rounded-xl bg-white p-2 shadow-sm">
          <div className="h-16 rounded-lg bg-gray-200" />
          <p className="mt-1 text-[10px] font-semibold text-primary-800">Earrings</p>
        </div>
      </div>
      <motion.button
        onClick={onNext}
        className="mt-3 w-full rounded-full bg-primary-700 py-2 text-xs font-semibold text-white"
        whileTap={{ scale: 0.97 }}
      >
        Browse Girls Collection
      </motion.button>
    </div>
  </motion.div>
);

const ProductScene = ({ onNext }) => (
  <motion.div
    className="absolute inset-0 bg-white"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="flex items-center border-b border-gray-200 px-4 py-2.5">
      <span className="text-sm font-semibold text-gray-800">← Back</span>
    </div>
    <div className="h-48 w-full bg-gray-100">
      <img src={girlsImage} alt="Girls Collection" className="h-full w-full object-cover" />
    </div>
    <div className="px-4 py-3">
      <h4 className="font-serif text-base font-bold text-primary-800">Classic Black Handbag</h4>
      <p className="text-xs text-ink-light">Size 1XL • Premium quality</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-base font-bold text-gold-600">Rs. 1,150</span>
        <motion.button
          onClick={onNext}
          className="rounded-full bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-md"
          whileTap={{ scale: 0.95 }}
        >
          Add to Cart
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const CartScene = ({ onNext }) => (
  <motion.div
    className="absolute inset-0 bg-gray-50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="border-b border-gray-200 bg-white px-4 py-2.5">
      <span className="text-sm font-bold text-primary-800">Cart (1)</span>
    </div>
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
        <div className="h-16 w-16 rounded-xl bg-gray-200" />
        <div className="flex-1">
          <p className="text-xs font-bold text-primary-800">Classic Black Handbag</p>
          <p className="text-[10px] text-ink-light">Size 1XL</p>
          <p className="text-xs font-bold text-gold-600">Rs. 1,150</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
        <span className="text-xs font-semibold text-ink-light">Subtotal</span>
        <span className="text-sm font-bold text-primary-800">Rs. 1,000</span>
      </div>
      <motion.button
        onClick={onNext}
        className="mt-3 w-full rounded-full bg-primary-700 py-2.5 text-sm font-semibold text-white shadow-md"
        whileTap={{ scale: 0.97 }}
      >
        Proceed to Checkout
      </motion.button>
    </div>
  </motion.div>
);

const CheckoutScene = ({ onNext }) => (
  <motion.div
    className="absolute inset-0 bg-gray-50"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="border-b border-gray-200 bg-white px-4 py-2.5">
      <span className="text-sm font-bold text-primary-800">Checkout</span>
    </div>
    <div className="px-4 py-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <label className="mb-1 block text-xs font-semibold text-gray-600">Delivery Address</label>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-[10px] text-gray-500">Kathmandu, Nepal</p>
        </div>
        <label className="mb-1 mt-2 block text-xs font-semibold text-gray-600">Phone</label>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-[10px] text-gray-500">98XXXXXXXX</p>
        </div>
      </div>
      <motion.button
        onClick={onNext}
        className="mt-3 w-full rounded-full bg-primary-700 py-2.5 text-sm font-semibold text-white shadow-md"
        whileTap={{ scale: 0.97 }}
      >
        Pay with eSewa
      </motion.button>
    </div>
  </motion.div>
);

const PaymentScene = ({ onNext }) => (
  <motion.div
    className="absolute inset-0 bg-white"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="h-16 w-16 rounded-full bg-green-100 p-3">
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-green-600">
          <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h4 className="mt-4 font-serif text-lg font-bold text-primary-800">Payment Successful</h4>
      <p className="mt-1 text-xs text-ink-light">eSewa Payment • Rs. 1,000</p>
      <motion.button
        onClick={onNext}
        className="mt-6 rounded-full bg-green-600 px-8 py-2.5 text-sm font-semibold text-white shadow-md"
        whileTap={{ scale: 0.95 }}
      >
        View Order
      </motion.button>
    </div>
  </motion.div>
);

const SuccessScene = ({ onNext }) => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-b from-green-50 to-white"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <motion.div
        className="h-20 w-20 rounded-full bg-green-500 p-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-white">
          <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <h3 className="mt-4 font-serif text-xl font-bold text-green-700">Order Confirmed!</h3>
      <p className="mt-1 text-xs text-ink-light">Delivering to Kathmandu, Nepal</p>
      <p className="mt-1 text-xs text-ink-light">Est. delivery: 3-5 days</p>
      <motion.button
        onClick={onNext}
        className="mt-6 rounded-full bg-primary-700 px-8 py-2.5 text-sm font-semibold text-white shadow-md"
        whileTap={{ scale: 0.95 }}
      >
        Continue
      </motion.button>
    </div>
  </motion.div>
);

const ThankYouScene = ({ onReplay }) => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-black"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <StatusBar />
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.div
        className="mb-4 h-20 w-20 overflow-hidden rounded-full border-4 border-gold-400 shadow-2xl"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <img src={sunuImage} alt="Sunita" className="h-full w-full object-cover" />
      </motion.div>
      <motion.h2 className="font-serif text-2xl font-bold text-gold-200">धन्यवाद!</motion.h2>
      <motion.p className="mt-2 text-sm text-white/90">www.sunitazcollection.com</motion.p>
      <motion.p className="mt-2 text-xs text-white/70">Follow us on TikTok @sunitas_collection</motion.p>
      <div className="mt-3 flex gap-3 text-xs font-semibold text-white/80">
        <span>📞 9768562128</span>
        <span>📞 9845423800</span>
      </div>
      <motion.button
        onClick={onReplay}
        className="mt-6 rounded-full bg-gold-500 px-6 py-2 text-xs font-semibold text-primary-900 shadow-lg"
        whileTap={{ scale: 0.95 }}
      >
        Replay Tutorial
      </motion.button>
    </div>
  </motion.div>
);

const PhoneVideoHero = () => {
  const [scene, setScene] = useState(0);
  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const { speaking, enabled, setEnabled, speak } = useVoiceover();

  const TOTAL_SCENES = 9;

  const advance = useCallback(() => {
    setScene((prev) => (prev + 1) % TOTAL_SCENES);
    setProgress(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          advance();
          return 0;
        }
        return prev + 2;
      });
    }, SCENE_DURATION / 50);
    return () => clearInterval(interval);
  }, [advance]);

  useEffect(() => {
    if (enabled && unlocked && scene < voiceLines.length) {
      speak(voiceLines[scene], scene);
    }
  }, [scene, enabled, unlocked, speak]);

  const scenes = [
    unlocked ? <SafariScene key="safari" onNext={advance} /> : <LockScene key="lock" onUnlock={() => { setUnlocked(true); advance(); }} />,
    <LoginScene key="login" onNext={advance} />,
    <HomepageScene key="homepage" onNext={advance} />,
    <ProductScene key="product" onNext={advance} />,
    <CartScene key="cart" onNext={advance} />,
    <CheckoutScene key="checkout" onNext={advance} />,
    <PaymentScene key="payment" onNext={advance} />,
    <SuccessScene key="success" onNext={advance} />,
    <ThankYouScene key="thankyou" onReplay={() => { setScene(0); setProgress(0); }} />,
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900 py-12 sm:py-16 lg:py-20">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-300 sm:text-sm">
            Sunita&apos;z Collection
          </p>
          <h2 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Watch How to Shop
          </h2>
          <p className="mt-2 text-sm text-white/80 sm:text-base">
            Full tutorial from login to delivery
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <motion.div
            className="relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* iPhone 17 Pro Max Titanium Body */}
            <div className="relative w-[280px] sm:w-[300px] rounded-[3.5rem] bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 p-[3px] shadow-2xl ring-1 ring-black/10">
              {/* Side Buttons */}
              <div className="absolute -right-[3px] top-28 h-14 w-[3px] rounded-r-full bg-gradient-to-b from-gray-300 to-gray-500" />
              <div className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l-full bg-gradient-to-b from-gray-300 to-gray-500" />
              <div className="absolute -left-[3px] top-36 h-10 w-[3px] rounded-l-full bg-gradient-to-b from-gray-300 to-gray-500" />
              <div className="absolute -right-[3px] top-20 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-gray-300 to-gray-500" />

              {/* Dynamic Island */}
              <DynamicIsland />

              {/* Screen */}
              <div className="relative h-[540px] w-full overflow-hidden rounded-[3.2rem] bg-black">
                <StatusBar />

                {/* Progress Bar */}
                <div className="absolute left-4 right-4 top-4 z-30 h-1 rounded-full bg-white/20">
                  <motion.div
                    className="h-full rounded-full bg-gold-400"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                </div>

                {/* Voiceover Toggle */}
                <button
                  onClick={() => setEnabled((v) => !v)}
                  className="absolute right-4 top-3 z-30 rounded-full bg-white/10 p-1.5 backdrop-blur-sm"
                >
                  <span className="text-white">{enabled ? '🔊' : '🔇'}</span>
                </button>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={scene}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                  >
                    {scenes[scene]}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-3 left-1/2 z-20 h-1 w-24 -translate-x-1/2 rounded-full bg-black/10" />
            </div>

            {/* Floating shadow beneath phone */}
            <div className="absolute -bottom-6 left-1/2 h-6 w-3/4 -translate-x-1/2 rounded-full bg-black/20 blur-xl" />
          </motion.div>

          {/* Voiceover status */}
          <div className="text-center">
            {enabled && speaking && (
              <motion.p
                className="text-xs text-gold-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                🔊 Playing voiceover...
              </motion.p>
            )}
          </div>

          <div className="text-center">
            <a
              href="/shop"
              className="inline-block rounded-full bg-gold-500 px-8 py-3 text-sm font-semibold text-primary-900 shadow-lg transition hover:scale-105 hover:bg-gold-400 hover:shadow-xl"
            >
              Start Shopping
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhoneVideoHero;
