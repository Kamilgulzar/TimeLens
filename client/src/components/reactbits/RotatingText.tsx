"use client";

import { useEffect, useState } from "react";
import { useId } from "react";

interface RotatingTextProps {
  items: string[];
  className?: string;
  interval?: number;
  duration?: number;
}

const RotatingText = ({
  items,
  className = "",
  interval = 3000,
  duration = 600,
}: RotatingTextProps) => {
  const id = useId();
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const timer = setInterval(() => {
      setAnimating(true);
      setIndex((i) => (i + 1) % items.length);
      window.setTimeout(() => setAnimating(false), duration);
    }, interval);
    return () => clearInterval(timer);
  }, [items.length, interval, duration]);

  const prevIndex = index === 0 ? items.length - 1 : index - 1;

  return (
    <span className={`relative inline-block overflow-hidden align-baseline ${className}`}>
      {animating && mounted && (
        <span
          key={`out-${id}`}
          className="absolute inset-0 whitespace-nowrap"
          style={{ animation: `slideOutUp-${id} ${duration}ms ease-in-out forwards` }}
        >
          {items[prevIndex]}
        </span>
      )}
      <span
        key={`in-${id}`}
        className="whitespace-nowrap"
        style={{
          animation:
            animating && mounted
              ? `slideInUp-${id} ${duration}ms ease-in-out forwards`
              : "none",
        }}
      >
        {items[index]}
      </span>
      <style>{`
        @keyframes slideOutUp-${id} {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-40px); opacity: 0; }
        }
        @keyframes slideInUp-${id} {
          0% { transform: translateY(40px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </span>
  );
};

export default RotatingText;
