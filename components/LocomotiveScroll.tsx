"use client";

import React, { useEffect } from "react";

interface LocomotiveScrollWrapperProps {
  children: React.ReactNode;
}

export default function LocomotiveScrollWrapper({
  children,
}: LocomotiveScrollWrapperProps) {
  useEffect(() => {
    let scrollInstance: any;

    (async () => {
      try {
        const LocomotiveScroll = (await import("locomotive-scroll")).default;
        scrollInstance = new LocomotiveScroll({
          lenisOptions: {
            wrapper: window,
            content: document.documentElement,
            lerp: 0.1,         // Scrolling ease / interpolation (0 = slow, 1 = instant)
            duration: 1.2,     // Scroll duration in seconds
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
          },
        });
      } catch (err) {
        console.error("Locomotive Scroll initialization failed:", err);
      }
    })();

    return () => {
      if (scrollInstance && typeof scrollInstance.destroy === "function") {
        scrollInstance.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
