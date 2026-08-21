import { useEffect, useRef, useCallback } from "react";
import "./ElectricBorder.css";

/**
 * ElectricBorder — Pure Crisp Sky Lightning Border (Single Continuous Arc).
 * 
 * Uses Recursive Midpoint Displacement to generate a razor-thin,
 * crisp fractal lightning bolt along the perimeter with no external branch shoots.
 */
const ElectricBorder = ({
  children,
  color = "#00f0ff",
  speed = 1,
  chaos = 0.12,
  borderRadius = 18,
  className,
  style,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animRef = useRef(null);
  
  // Lightning state cache
  const lightningPathRef = useRef([]);
  const lastStrikeTimeRef = useRef(0);

  // Rounded rectangle perimeter point
  const getCornerPoint = useCallback((cx, cy, r, startAngle, arcLen, t) => {
    const angle = startAngle + t * arcLen;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }, []);

  const getPerimeterPoint = useCallback((t, L, T, W, H, r) => {
    const sw = W - 2 * r;
    const sh = H - 2 * r;
    const ca = (Math.PI * r) / 2;
    const perim = 2 * sw + 2 * sh + 4 * ca;
    let d = ((t % 1) + 1) % 1 * perim;
    let acc = 0;

    if (d <= acc + sw) return { x: L + r + ((d - acc) / sw) * sw, y: T };
    acc += sw;
    if (d <= acc + ca) return getCornerPoint(L + W - r, T + r, r, -Math.PI / 2, Math.PI / 2, (d - acc) / ca);
    acc += ca;
    if (d <= acc + sh) return { x: L + W, y: T + r + ((d - acc) / sh) * sh };
    acc += sh;
    if (d <= acc + ca) return getCornerPoint(L + W - r, T + H - r, r, 0, Math.PI / 2, (d - acc) / ca);
    acc += ca;
    if (d <= acc + sw) return { x: L + W - r - ((d - acc) / sw) * sw, y: T + H };
    acc += sw;
    if (d <= acc + ca) return getCornerPoint(L + r, T + H - r, r, Math.PI / 2, Math.PI / 2, (d - acc) / ca);
    acc += ca;
    if (d <= acc + sh) return { x: L, y: T + H - r - ((d - acc) / sh) * sh };
    acc += sh;
    return getCornerPoint(L + r, T + r, r, Math.PI, Math.PI / 2, (d - acc) / ca);
  }, [getCornerPoint]);

  /**
   * Recursive Fractal Midpoint Displacement (pure single lightning arc, no shoots)
   */
  const generateFractalLightning = useCallback((p1, p2, depth, maxDepth, amplitude, normal) => {
    if (depth >= maxDepth) {
      return [p1, p2];
    }

    // Midpoint
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    // Jagged perpendicular displacement
    const displacement = (Math.random() * 2 - 1) * amplitude;
    const displacedMid = {
      x: midX + normal.x * displacement,
      y: midY + normal.y * displacement,
    };

    const left = generateFractalLightning(p1, displacedMid, depth + 1, maxDepth, amplitude * 0.55, normal);
    const right = generateFractalLightning(displacedMid, p2, depth + 1, maxDepth, amplitude * 0.55, normal);

    return [...left.slice(0, -1), ...right];
  }, []);

  /**
   * Generates clean continuous sky lightning around the perimeter
   */
  const buildFullLightningStrike = useCallback((W, H, PAD, r, amp) => {
    const bw = W - PAD * 2;
    const bh = H - PAD * 2;
    const cr = Math.min(borderRadius, Math.min(bw, bh) / 2);

    // Number of primary guide anchors along the perimeter
    const anchorCount = 18;
    const anchors = [];
    const normals = [];

    for (let i = 0; i < anchorCount; i++) {
      const t = i / anchorCount;
      const pt = getPerimeterPoint(t, PAD, PAD, bw, bh, cr);
      anchors.push(pt);

      // Compute outward normal
      const tNext = ((i + 0.1) / anchorCount) % 1;
      const ptNext = getPerimeterPoint(tNext, PAD, PAD, bw, bh, cr);
      const dx = ptNext.x - pt.x;
      const dy = ptNext.y - pt.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      normals.push({ x: dy / len, y: -dx / len });
    }

    const fullPath = [];

    for (let i = 0; i < anchorCount; i++) {
      const pStart = anchors[i];
      const pEnd = anchors[(i + 1) % anchorCount];
      const normal = normals[i];

      // Depth 3 subdivision = clean, crisp lightning segments
      const segment = generateFractalLightning(pStart, pEnd, 0, 3, amp, normal);
      if (i === 0) {
        fullPath.push(...segment);
      } else {
        fullPath.push(...segment.slice(1));
      }
    }

    return fullPath;
  }, [borderRadius, generateFractalLightning, getPerimeterPoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PAD = 8;
    // Tight displacement amplitude for a thin, crisp lightning line
    const AMP = chaos * 20 + 2.8;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const W = rect.width + PAD * 2;
      const H = rect.height + PAD * 2;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(W * dpr);
      canvas.height = Math.ceil(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { W, H };
    };

    let dims = updateSize();
    let lastDpr = Math.min(window.devicePixelRatio || 1, 2);

    // Initial strike
    lightningPathRef.current = buildFullLightningStrike(dims.W, dims.H, PAD, borderRadius, AMP);
    lastStrikeTimeRef.current = performance.now();

    const draw = (now) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (dpr !== lastDpr) {
        lastDpr = dpr;
        dims = updateSize();
      }
      const { W, H } = dims;

      // Strike interval (cadence adjusted by speed)
      const strikeInterval = (65 / Math.max(0.2, speed));
      if (now - lastStrikeTimeRef.current > strikeInterval) {
        lightningPathRef.current = buildFullLightningStrike(W, H, PAD, borderRadius, AMP);
        lastStrikeTimeRef.current = now;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const path = lightningPathRef.current;
      if (!path || path.length < 2) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const traceLightning = (pts) => {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
          else ctx.lineTo(pts[i].x, pts[i].y);
        }
      };

      const flicker = 0.88 + Math.random() * 0.12;

      ctx.lineCap = "butt";
      ctx.lineJoin = "miter";
      ctx.miterLimit = 3.5;

      // ── Layer 1: Tight, Delicate Neon Corona ──────────────────────────────
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.2;
      ctx.globalAlpha = 0.35 * flicker;
      ctx.shadowColor = color;
      ctx.shadowBlur = 5;
      traceLightning(path);
      ctx.stroke();

      // ── Layer 2: Thin Vivid Neon Lightning Line ───────────────────────────
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = 0.90 * flicker;
      ctx.shadowColor = color;
      ctx.shadowBlur = 2;
      ctx.strokeStyle = color;
      traceLightning(path);
      ctx.stroke();

      // ── Layer 3: Razor-Thin White-Hot Sky Strike Spine ───────────────────
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 1.0 * flicker;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 1;
      ctx.strokeStyle = "#ffffff";
      traceLightning(path);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(() => {
      dims = updateSize();
      lightningPathRef.current = buildFullLightningStrike(dims.W, dims.H, PAD, borderRadius, AMP);
    });
    ro.observe(container);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [color, speed, chaos, borderRadius, buildFullLightningStrike]);

  return (
    <div
      ref={containerRef}
      className={"electric-border " + (className || "")}
      style={{ "--electric-border-color": color, borderRadius, ...style }}
    >
      <div className="eb-canvas-container">
        <canvas ref={canvasRef} className="eb-canvas" />
      </div>
      <div className="eb-content">{children}</div>
    </div>
  );
};

export default ElectricBorder;
