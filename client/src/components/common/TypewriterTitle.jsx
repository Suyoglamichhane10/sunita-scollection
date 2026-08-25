import React, { useEffect, useState } from 'react';

const TypewriterTitle = ({ words, className = '' }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    if (index >= words.length) return;

    const currentWord = words[index];

    if (!reverse && subIndex < currentWord.length) {
      const timeout = setTimeout(() => setSubIndex((prev) => prev + 1), 80);
      return () => clearTimeout(timeout);
    }

    if (!reverse && subIndex === currentWord.length) {
      const timeout = setTimeout(() => setReverse(true), 1800);
      return () => clearTimeout(timeout);
    }

    if (reverse && subIndex > 0) {
      const timeout = setTimeout(() => setSubIndex((prev) => prev - 1), 50);
      return () => clearTimeout(timeout);
    }

    if (reverse && subIndex === 0) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
    }
  }, [subIndex, reverse, index, words]);

  useEffect(() => {
    const blinkTimeout = setInterval(() => setBlink((prev) => !prev), 500);
    return () => clearInterval(blinkTimeout);
  }, []);

  return (
    <span className={className}>
      {words[index].substring(0, subIndex)}
      <span className={`ml-1 inline-block w-2 ${blink ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}>|</span>
    </span>
  );
};

export default TypewriterTitle;
