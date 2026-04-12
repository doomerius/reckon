import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Map, RotateCw, Maximize2, Crosshair } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { COASTLINES, REFERENCE_POINTS } from '../data/worldData';

interface Point3D { x: number; y: number; z: number }

function latLngTo3D(lat: number, lng: number, r: number): Point3D {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return {
    x: -(r * Math.sin(phi) * Math.cos(theta)),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

function rotateY(p: Point3D, a: number): Point3D {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function rotateX(p: Point3D, a: number): Point3D {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function project(p: Point3D, cx: number, cy: number): [number, number, number] {
  return [cx + p.x, cy - p.y, p.z];
}

// Cubic bezier interpolation for smoother coastlines
function interpolateCoast(points: [number, number][], steps: number): [number, number][] {
  if (points.length < 3) return points;
  const result: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    for (let t = 0; t < steps; t++) {
      const f = t / steps;
      const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * f + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p0[0]) * f * f);
      const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * f + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p0[1]) * f * f);
      result.push([x, y]);
    }
  }
  return result;
}

export default function GlobeView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useApp();
  const [rotation, setRotation] = useState({ x: -0.35, y: 0.5 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const vehiclePositionsRef = useRef<{ id: string; x: number; y: number; r: number; vehicle: typeof state.vehicles[0] }[]>([]);

  // Pre-compute interpolated coastlines
  const smoothCoasts = useRef(COASTLINES.map((c) => interpolateCoast(c, 2)));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.36;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // ── Background ──
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#04060a');
    bgGrad.addColorStop(0.5, '#06080d');
    bgGrad.addColorStop(1, '#080b12');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // ── Stars ──
    timeRef.current += 0.016;
    const starSeed = 77;
    for (let i = 0; i < 300; i++) {
      const sx = ((starSeed * (i + 1) * 7919) % w);
      const sy = ((starSeed * (i + 1) * 6271) % h);
      const dist = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
      if (dist < radius * 1.1) continue;
      const twinkle = 0.3 + 0.4 * Math.sin(timeRef.current * (1 + (i % 5) * 0.3) + i);
      ctx.fillStyle = `rgba(180, 200, 255, ${twinkle * 0.6})`;
      const size = ((i * 31) % 3 === 0) ? 1.5 : 1;
      ctx.fillRect(sx, sy, size, size);
    }

    // ── Outer atmosphere layers ──
    for (let layer = 3; layer >= 0; layer--) {
      const r = radius * (1.05 + layer * 0.06);
      const opacity = 0.04 - layer * 0.008;
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.9, cx, cy, r);
      grad.addColorStop(0, `rgba(59, 130, 246, 0)`);
      grad.addColorStop(0.6, `rgba(59, 130, 246, ${opacity})`);
      grad.addColorStop(1, `rgba(59, 130, 246, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Globe sphere ──
    const lightX = cx - radius * 0.4;
    const lightY = cy - radius * 0.4;
    const sphereGrad = ctx.createRadialGradient(lightX, lightY, 0, cx, cy, radius);
    sphereGrad.addColorStop(0, '#162036');
    sphereGrad.addColorStop(0.4, '#0e1525');
    sphereGrad.addColorStop(0.75, '#0a0f1a');
    sphereGrad.addColorStop(1, '#050810');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Rim light
    const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius);
    rimGrad.addColorStop(0, 'rgba(59, 130, 246, 0)');
    rimGrad.addColorStop(0.8, 'rgba(59, 130, 246, 0.02)');
    rimGrad.addColorStop(1, 'rgba(59, 130, 246, 0.12)');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Clip to sphere
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    const rotY = rotation.y;
    const rotXV = rotation.x;

    // ── Grid lines ──
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.06)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lng = -180; lng <= 180; lng += 3) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotY);
        p = rotateX(p, rotXV);
        if (p.z > 0) {
          const [sx, sy] = project(p, cx, cy);
          if (!started) { ctx.moveTo(sx, sy); started = true; }
          else ctx.lineTo(sx, sy);
        } else { started = false; }
      }
      ctx.stroke();
    }
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 3) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotY);
        p = rotateX(p, rotXV);
        if (p.z > 0) {
          const [sx, sy] = project(p, cx, cy);
          if (!started) { ctx.moveTo(sx, sy); started = true; }
          else ctx.lineTo(sx, sy);
        } else { started = false; }
      }
      ctx.stroke();
    }

    // ── Coastlines ──
    for (const coast of smoothCoasts.current) {
      // Filled landmass
      ctx.beginPath();
      let started = false;
      let allVisible = true;
      const screenPoints: [number, number][] = [];

      for (const [lng, lat] of coast) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotY);
        p = rotateX(p, rotXV);
        if (p.z > 0) {
          const [sx, sy] = project(p, cx, cy);
          screenPoints.push([sx, sy]);
          if (!started) { ctx.moveTo(sx, sy); started = true; }
          else ctx.lineTo(sx, sy);
        } else {
          allVisible = false;
          started = false;
        }
      }

      if (screenPoints.length > 2 && allVisible) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(34, 197, 94, 0.04)';
        ctx.fill();
      }

      // Outline glow
      ctx.beginPath();
      started = false;
      for (const [lng, lat] of coast) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotY);
        p = rotateX(p, rotXV);
        if (p.z > 0) {
          const [sx, sy] = project(p, cx, cy);
          const depthFade = Math.min(1, p.z / (radius * 0.5));
          ctx.strokeStyle = `rgba(34, 197, 94, ${0.35 * depthFade})`;
          if (!started) { ctx.moveTo(sx, sy); started = true; }
          else ctx.lineTo(sx, sy);
        } else { started = false; }
      }
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.stroke();

      // Brighter inner line
      ctx.beginPath();
      started = false;
      for (const [lng, lat] of coast) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotY);
        p = rotateX(p, rotXV);
        if (p.z > 0) {
          const [sx, sy] = project(p, cx, cy);
          if (!started) { ctx.moveTo(sx, sy); started = true; }
          else ctx.lineTo(sx, sy);
        } else { started = false; }
      }
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
      ctx.stroke();
    }

    // ── City reference points ──
    if (showLabels) {
      for (const [lng, lat, name] of REFERENCE_POINTS) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotY);
        p = rotateX(p, rotXV);
        if (p.z > radius * 0.3) {
          const [sx, sy] = project(p, cx, cy);
          const depthFade = Math.min(1, (p.z - radius * 0.3) / (radius * 0.7));
          ctx.fillStyle = `rgba(148, 163, 184, ${0.15 * depthFade})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '9px Inter';
          ctx.fillStyle = `rgba(148, 163, 184, ${0.4 * depthFade})`;
          ctx.textAlign = 'center';
          ctx.fillText(name, sx, sy - 6);
        }
      }
    }

    // ── Vehicles ──
    const positions: typeof vehiclePositionsRef.current = [];

    for (const vehicle of state.vehicles) {
      let p = latLngTo3D(vehicle.lat, vehicle.lng, radius);
      p = rotateY(p, rotY);
      p = rotateX(p, rotXV);

      if (p.z > radius * 0.05) {
        const [sx, sy] = project(p, cx, cy);
        const depthFade = Math.min(1, p.z / (radius * 0.5));
        const isHovered = hoveredVehicle === vehicle.id;
        const isActive = vehicle.status === 'active';
        const dotR = isHovered ? 6 : isActive ? 4 : 3;

        const color = vehicle.status === 'active'
          ? [52, 211, 153]
          : vehicle.status === 'idle'
            ? [251, 191, 36]
            : [148, 163, 184];

        // Outer pulse ring for active vehicles
        if (isActive) {
          const pulsePhase = (timeRef.current * 1.5 + parseFloat(vehicle.id.replace(/\D/g, '') || '0') * 0.5) % 1;
          const pulseR = dotR + 8 * pulsePhase;
          const pulseAlpha = (1 - pulsePhase) * 0.3 * depthFade;
          ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${pulseAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Glow
        const glowR = dotR * 4;
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        glow.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.3 * depthFade})`);
        glow.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.9 * depthFade})`;
        ctx.beginPath();
        ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
        ctx.fill();

        // Center highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * depthFade})`;
        ctx.beginPath();
        ctx.arc(sx, sy, dotR * 0.4, 0, Math.PI * 2);
        ctx.fill();

        positions.push({ id: vehicle.id, x: sx, y: sy, r: dotR * 4, vehicle });

        // Hover label
        if (isHovered) {
          const labelW = 220;
          const labelH = 64;
          const lx = sx - labelW / 2;
          const ly = sy - dotR - labelH - 12;

          // Arrow
          ctx.fillStyle = '#151c2bee';
          ctx.beginPath();
          ctx.moveTo(sx - 6, ly + labelH);
          ctx.lineTo(sx + 6, ly + labelH);
          ctx.lineTo(sx, ly + labelH + 6);
          ctx.closePath();
          ctx.fill();

          // Background
          ctx.fillStyle = '#151c2bee';
          ctx.strokeStyle = 'rgba(56, 72, 100, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(lx, ly, labelW, labelH, 8);
          ctx.fill();
          ctx.stroke();

          // Content
          ctx.textAlign = 'left';
          ctx.font = '600 12px Inter';
          ctx.fillStyle = '#e8edf5';
          ctx.fillText(vehicle.name, lx + 12, ly + 18);

          ctx.font = '10px "JetBrains Mono"';
          ctx.fillStyle = '#8893a7';
          ctx.fillText(vehicle.ownerName, lx + 12, ly + 33);

          ctx.font = '10px "JetBrains Mono"';
          ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.9)`;
          const info = `${vehicle.type.toUpperCase()} | ${vehicle.speed > 0 ? vehicle.speed + (vehicle.type === 'boat' || vehicle.type === 'yacht' ? ' kts' : ' mph') : 'STATIONARY'}`;
          ctx.fillText(info, lx + 12, ly + 50);

          if (vehicle.altitude) {
            ctx.fillStyle = '#5a6478';
            ctx.fillText(`FL${Math.round(vehicle.altitude / 100)}`, lx + labelW - 50, ly + 50);
          }
        }
      }
    }

    vehiclePositionsRef.current = positions;
    ctx.restore(); // remove sphere clip
    ctx.restore(); // remove dpr scale
  }, [rotation, state.vehicles, hoveredVehicle, showLabels]);

  // ── Animation loop ──
  useEffect(() => {
    const animate = () => {
      if (!isDragging) {
        if (autoRotate) {
          setRotation((r) => ({
            x: r.x + velocity.x * 0.95,
            y: r.y + 0.0015 + velocity.y * 0.95,
          }));
        } else {
          setRotation((r) => ({
            x: r.x + velocity.x * 0.95,
            y: r.y + velocity.y * 0.95,
          }));
        }
        setVelocity((v) => ({ x: v.x * 0.95, y: v.y * 0.95 }));
      }
      draw();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [autoRotate, isDragging, draw, velocity]);

  // ── Resize ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = parent.clientWidth + 'px';
      canvas.style.height = parent.clientHeight + 'px';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Mouse interactions ──
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    if (isDragging) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      setRotation((r) => ({
        x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, r.x + dy * 0.004)),
        y: r.y + dx * 0.004,
      }));
      setVelocity({ x: dy * 0.0004, y: dx * 0.0004 });
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }

    // Hover detection
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left);
    const my = (e.clientY - rect.top);
    let found: string | null = null;
    for (const pos of vehiclePositionsRef.current) {
      const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
      if (dist < pos.r) { found = pos.id; break; }
    }
    setHoveredVehicle(found);
    canvas.style.cursor = found ? 'pointer' : isDragging ? 'grabbing' : 'grab';
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => { setIsDragging(false); setHoveredVehicle(null); };

  const activeCount = state.vehicles.filter((v) => v.status === 'active').length;
  const idleCount = state.vehicles.filter((v) => v.status === 'idle').length;

  return (
    <div className="h-full flex flex-col" style={{ background: '#04060a' }}>
      {/* Header */}
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold text-white tracking-tight">Globe View</h1>
          <div className="h-4 w-px" style={{ background: 'var(--border-subtle)' }} />
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              <span className="text-emerald-400 mono font-medium">{activeCount}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>active</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-400 mono font-medium">{idleCount}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>idle</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 ${showLabels ? '!border-blue-500/30 !text-blue-400' : ''}`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            Labels
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 ${autoRotate ? '!border-blue-500/30 !text-blue-400' : ''}`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={autoRotate ? { animationDuration: '4s' } : {}} />
            Rotate
          </button>
          <Link to="/map" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5" />
            2D Map
          </Link>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full"
        />

        {/* Legend overlay */}
        <div className="absolute bottom-4 right-4 p-3 rounded-lg text-xs space-y-2" style={{ background: 'rgba(10, 14, 22, 0.85)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(8px)' }}>
          <p className="font-semibold text-white tracking-tight">Tracked Vehicles</p>
          <div className="space-y-1.5">
            {state.vehicles.slice(0, 6).map((v) => (
              <div key={v.id} className="flex items-center gap-2 group cursor-default"
                onMouseEnter={() => setHoveredVehicle(v.id)}
                onMouseLeave={() => setHoveredVehicle(null)}>
                <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-emerald-400' : v.status === 'idle' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                <span className="mono group-hover:text-white transition-colors" style={{ color: 'var(--text-secondary)' }}>{v.name}</span>
              </div>
            ))}
            {state.vehicles.length > 6 && (
              <span className="mono" style={{ color: 'var(--text-tertiary)' }}>+{state.vehicles.length - 6} more</span>
            )}
          </div>
        </div>

        {/* Hovered vehicle detail */}
        {hoveredVehicle && (() => {
          const v = state.vehicles.find((x) => x.id === hoveredVehicle);
          if (!v) return null;
          return (
            <div className="absolute top-4 left-4 p-4 rounded-lg animate-fade-in" style={{ background: 'rgba(10, 14, 22, 0.9)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)', minWidth: 240 }}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${v.status === 'active' ? 'bg-emerald-400' : v.status === 'idle' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                <span className="font-semibold text-white text-sm">{v.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div><span style={{ color: 'var(--text-tertiary)' }}>Owner</span></div>
                <div className="mono" style={{ color: 'var(--text-secondary)' }}>{v.ownerName}</div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>Type</span></div>
                <div className="mono uppercase" style={{ color: 'var(--text-secondary)' }}>{v.type}</div>
                <div><span style={{ color: 'var(--text-tertiary)' }}>Speed</span></div>
                <div className="mono" style={{ color: 'var(--text-secondary)' }}>{v.speed > 0 ? `${v.speed} ${v.type === 'boat' || v.type === 'yacht' ? 'kts' : 'mph'}` : 'Stationary'}</div>
                {v.altitude ? <>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>Altitude</span></div>
                  <div className="mono" style={{ color: 'var(--text-secondary)' }}>{v.altitude.toLocaleString()} ft</div>
                </> : null}
                <div><span style={{ color: 'var(--text-tertiary)' }}>Reg</span></div>
                <div className="mono" style={{ color: 'var(--text-secondary)' }}>{v.registration}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
