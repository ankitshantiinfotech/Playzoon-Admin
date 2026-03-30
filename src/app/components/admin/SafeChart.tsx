// Safe wrapper for Recharts — delays rendering until the container has non-zero dimensions.
// This prevents the "width(0) and height(0)" warning from ResponsiveContainer.

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface SafeChartProps {
  height: number;
  children: ReactNode;
  className?: string;
}

export function SafeChart({ height, children, className }: SafeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Check if already has dimensions
    if (el.clientWidth > 0) {
      setReady(true);
      return;
    }

    // Otherwise wait for layout via ResizeObserver
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setReady(true);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height }}
    >
      {ready && (
        <ResponsiveContainer width="100%" height={height}>
          {children as React.ComponentProps<typeof ResponsiveContainer>["children"]}
        </ResponsiveContainer>
      )}
    </div>
  );
}
