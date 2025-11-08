"use client";

import { useEffect, useRef, useState } from "react";

type AutomationGraphProps = {
  className?: string;
  nodeCount?: number;
  maxConnectionDistance?: number;
  hue?: number; // base hue for color accents (deprecated if hueLight/hueDark provided)
  hueLight?: number;
  hueDark?: number;
  animated?: boolean;
};

type Vector = { x: number; y: number };

type Node = {
  position: Vector;
  velocity: Vector;
  radius: number;
};

export default function AutomationGraph({
  className,
  nodeCount = 80,
  maxConnectionDistance = 140,
  hue = 270,
  hueLight,
  hueDark,
  animated = true,
}: AutomationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef<Vector | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      const { clientWidth, clientHeight } = canvas;
      canvas.width = Math.floor(clientWidth * devicePixelRatio);
      canvas.height = Math.floor(clientHeight * devicePixelRatio);
    }

    function random(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function initNodes() {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;
      const count = Math.floor(nodeCount * (width * height) / (1200 * 800));
      const desired = Math.max(30, Math.min(nodeCount, count));
      const nodes: Node[] = [];
      for (let i = 0; i < desired; i++) {
        nodes.push({
          position: { x: random(0, width), y: random(0, height) },
          velocity: { x: random(-0.25, 0.25), y: random(-0.25, 0.25) },
          radius: random(1.2, 2.4) * devicePixelRatio,
        });
      }
      nodesRef.current = nodes;
    }

    function stepNodes() {
      if (!canvas) return;
      const { width, height } = canvas;
      for (const node of nodesRef.current) {
        node.position.x += node.velocity.x * devicePixelRatio * 0.8;
        node.position.y += node.velocity.y * devicePixelRatio * 0.8;
        if (node.position.x <= 0 || node.position.x >= width) node.velocity.x *= -1;
        if (node.position.y <= 0 || node.position.y >= height) node.velocity.y *= -1;
      }
    }

    function draw() {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // choose hue by theme
      const effectiveHue = isDark ? (hueDark ?? hue) : (hueLight ?? hue);

      // background subtle gradient tint
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      const bgAlpha = isDark ? 0.1 : 0.05;
      bgGradient.addColorStop(0, `rgba(${hueToRGB(effectiveHue)}, ${bgAlpha})`);
      bgGradient.addColorStop(1, `rgba(${hueToRGB(effectiveHue + 40)}, ${bgAlpha})`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const maxDist = maxConnectionDistance * devicePixelRatio;

      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.position.x - b.position.x;
          const dy = a.position.y - b.position.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            const t = 1 - dist / maxDist;
            ctx.strokeStyle = `rgba(${hueToRGB(effectiveHue)}, ${isDark ? 0.25 + t * 0.3 : 0.12 + t * 0.25})`;
            ctx.lineWidth = Math.max(0.5, t * 1.6);
            ctx.beginPath();
            ctx.moveTo(a.position.x, a.position.y);
            ctx.lineTo(b.position.x, b.position.y);
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const node of nodes) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${hueToRGB(effectiveHue + 20)}, ${isDark ? 1 : 0.9})`;
        ctx.shadowColor = `rgba(${hueToRGB(effectiveHue)}, ${isDark ? 0.6 : 0.35})`;
        ctx.shadowBlur = 12 * devicePixelRatio;
        ctx.arc(node.position.x, node.position.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // slight pull toward mouse to add “intentionality”
      if (mouseRef.current) {
        const m = mouseRef.current;
        for (const node of nodes) {
          const dx = m.x - node.position.x;
          const dy = m.y - node.position.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist * 0.8 && dist > 0.001) {
            const pull = (maxDist * 0.8 - dist) / (maxDist * 0.8);
            node.position.x += (dx / dist) * pull * 1.2;
            node.position.y += (dy / dist) * pull * 1.2;
          }
        }
      }
    }

    function tick() {
      if (animated) stepNodes();
      draw();
      animationRef.current = requestAnimationFrame(tick);
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * devicePixelRatio;
      const y = (e.clientY - rect.top) * devicePixelRatio;
      mouseRef.current = { x, y };
    };
    const onMouseLeave = () => {
      mouseRef.current = null;
    };

    const onResize = () => {
      devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      resize();
      initNodes();
      draw();
    };

    resize();
    initNodes();
    tick();
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("resize", onResize);

    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animated, hue, hueDark, hueLight, isDark, maxConnectionDistance, nodeCount]);

  useEffect(() => {
    // Watch prefers-color-scheme to toggle dark mode styles without extra libs
    const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setIsDark(media ? media.matches : false);
    apply();
    if (media && typeof media.addEventListener === "function") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    } else if (media && typeof media.addListener === "function") {
      // Safari fallback
      media.addListener(apply);
      return () => media.removeListener(apply);
    }
  }, []);

  return (
    <div className={className} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}

function hueToRGB(h: number): string {
  const hue = ((h % 360) + 360) % 360;
  const s = 70;
  const l = 60;
  const { r, g, b } = hslToRgb(hue, s, l);
  return `${r}, ${g}, ${b}`;
}

// HSL to RGB in 0-255
function hslToRgb(h: number, s: number, l: number) {
  const s1 = s / 100;
  const l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}


