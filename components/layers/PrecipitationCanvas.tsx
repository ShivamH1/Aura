"use client";

import { useEffect, useRef } from "react";

interface PrecipitationCanvasProps {
  kind: "rain" | "snow";
  intensity: number;
  reducedMotion: boolean;
}

interface Drop {
  x: number;
  y: number;
  len: number;
  vy: number;
  vx: number;
  alpha: number;
}

interface Flake {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number; // amplitude
  swaySpeed: number;
  phase: number;
  alpha: number;
}

function computeCount(kind: "rain" | "snow", intensity: number, width: number): number {
  const clamp = Math.min(1, Math.max(0, intensity));
  const max = kind === "rain" ? 260 : 160;
  let count = Math.round(max * (0.3 + clamp * 0.7));
  if (width < 640) count = Math.round(count * 0.5);
  else if (width < 1024) count = Math.round(count * 0.75);
  return Math.max(12, count);
}

export default function PrecipitationCanvas({
  kind,
  intensity,
  reducedMotion,
}: PrecipitationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvas: HTMLCanvasElement = canvasEl;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let width = 0;
    let height = 0;
    let dpr = 1;

    const drops: Drop[] = [];
    const flakes: Flake[] = [];

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    function resetDrop(d: Drop, fromTop: boolean): void {
      d.x = Math.random() * width;
      d.y = fromTop ? -20 - Math.random() * height : Math.random() * height;
      d.len = rand(10, 22);
      d.vy = rand(620, 980);
      d.vx = rand(40, 110);
      d.alpha = rand(0.25, 0.6);
    }

    function resetFlake(f: Flake, fromTop: boolean): void {
      f.x = Math.random() * width;
      f.y = fromTop ? -10 - Math.random() * height : Math.random() * height;
      f.r = rand(1.2, 3.6);
      f.vy = rand(35, 90);
      f.sway = rand(8, 34);
      f.swaySpeed = rand(0.4, 1.3);
      f.phase = rand(0, Math.PI * 2);
      f.alpha = rand(0.45, 0.95);
    }

    function build(): void {
      drops.length = 0;
      flakes.length = 0;
      const count = computeCount(kind, intensity, window.innerWidth);
      if (kind === "rain") {
        for (let i = 0; i < count; i++) {
          const d: Drop = { x: 0, y: 0, len: 0, vy: 0, vx: 0, alpha: 0 };
          resetDrop(d, false);
          drops.push(d);
        }
      } else {
        for (let i = 0; i < count; i++) {
          const f: Flake = {
            x: 0,
            y: 0,
            r: 0,
            vy: 0,
            sway: 0,
            swaySpeed: 0,
            phase: 0,
            alpha: 0,
          };
          resetFlake(f, false);
          flakes.push(f);
        }
      }
    }

    function resize(): void {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawStatic(): void {
      ctx.clearRect(0, 0, width, height);
      build();
      if (kind === "rain") {
        ctx.strokeStyle = "rgba(180,210,255,0.4)";
        ctx.lineWidth = 1.1;
        for (const d of drops) {
          ctx.globalAlpha = d.alpha;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.vx * 0.02, d.y + d.len);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = "rgba(255,255,255,1)";
        for (const f of flakes) {
          ctx.globalAlpha = f.alpha;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    resize();

    if (reducedMotion) {
      drawStatic();
      const onResizeStatic = () => {
        resize();
        drawStatic();
      };
      window.addEventListener("resize", onResizeStatic);
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    build();

    let rafId = 0;
    let last = performance.now();
    let running = true;

    function frame(now: number): void {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, width, height);

      if (kind === "rain") {
        ctx.lineWidth = 1.1;
        ctx.lineCap = "round";
        for (const d of drops) {
          d.y += d.vy * dt;
          d.x += d.vx * dt;
          if (d.y - d.len > height || d.x > width + 20) {
            resetDrop(d, true);
            continue;
          }
          ctx.strokeStyle = `rgba(180,210,255,${d.alpha})`;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.vx * 0.02, d.y + d.len);
          ctx.stroke();
        }
      } else {
        for (const f of flakes) {
          f.y += f.vy * dt;
          f.phase += f.swaySpeed * dt;
          const x = f.x + Math.sin(f.phase) * f.sway;
          if (f.y - f.r > height) {
            resetFlake(f, true);
            continue;
          }
          ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
          ctx.beginPath();
          ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function start(): void {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function stop(): void {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function onVisibility(): void {
      if (document.hidden) stop();
      else start();
    }

    function onResize(): void {
      resize();
      build();
    }

    rafId = requestAnimationFrame(frame);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, [kind, intensity, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 -z-7 pointer-events-none"
    />
  );
}
