"use client";

import { useEffect, useRef } from "react";

type ParallaxTiltProps = {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number; // maximum rotation on each axis
  maxTranslatePx?: number; // subtle translation
  perspectivePx?: number; // perspective strength
};

export default function ParallaxTilt({
  children,
  className,
  maxTiltDeg = 6,
  maxTranslatePx = 10,
  perspectivePx = 900,
}: ParallaxTiltProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0 });
  const currentRef = useRef({ rx: 0, ry: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function apply() {
      const c = currentRef.current;
      el.style.transform = `perspective(${perspectivePx}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) translate(${c.tx}px, ${c.ty}px)`;
      rafRef.current = requestAnimationFrame(tick);
    }

    function tick() {
      const c = currentRef.current;
      const t = targetRef.current;
      // Smooth spring-like lerp
      c.rx += (t.rx - c.rx) * 0.12;
      c.ry += (t.ry - c.ry) * 0.12;
      c.tx += (t.tx - c.tx) * 0.12;
      c.ty += (t.ty - c.ty) * 0.12;
      apply();
    }

    function onPointerMove(e: PointerEvent) {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      targetRef.current.ry = clamp(dx * maxTiltDeg, -maxTiltDeg, maxTiltDeg);
      targetRef.current.rx = clamp(-dy * maxTiltDeg, -maxTiltDeg, maxTiltDeg);
      targetRef.current.tx = clamp(dx * maxTranslatePx, -maxTranslatePx, maxTranslatePx);
      targetRef.current.ty = clamp(dy * maxTranslatePx, -maxTranslatePx, maxTranslatePx);
    }

    function onPointerLeave() {
      targetRef.current = { rx: 0, ry: 0, tx: 0, ty: 0 };
    }

    function onDeviceOrientation(e: DeviceOrientationEvent) {
      // beta: front-back tilt (-180,180), gamma: left-right (-90,90)
      const beta = e.beta ?? 0; // X axis
      const gamma = e.gamma ?? 0; // Y axis
      const ry = clamp((gamma / 45) * maxTiltDeg, -maxTiltDeg, maxTiltDeg);
      const rx = clamp((-beta / 45) * maxTiltDeg, -maxTiltDeg, maxTiltDeg);
      targetRef.current.ry = ry;
      targetRef.current.rx = rx;
      targetRef.current.tx = clamp((gamma / 45) * maxTranslatePx, -maxTranslatePx, maxTranslatePx);
      targetRef.current.ty = clamp((beta / 45) * maxTranslatePx, -maxTranslatePx, maxTranslatePx);
    }

    // Start animation loop
    apply();
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerleave", onPointerLeave);
    // Device orientation (will be ignored if not supported/permission denied)
    window.addEventListener("deviceorientation", onDeviceOrientation);

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("deviceorientation", onDeviceOrientation);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [maxTiltDeg, maxTranslatePx, perspectivePx]);

  return (
    <div ref={ref} className={className} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
      {children}
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}


