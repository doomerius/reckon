import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Map, RotateCw } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

function latLngTo3D(lat: number, lng: number, radius: number): Point3D {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

function rotateY(point: Point3D, angle: number): Point3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  };
}

function rotateX(point: Point3D, angle: number): Point3D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos,
  };
}

// Simplified world coastline coordinates for rendering
const COASTLINES: [number, number][][] = [
  // North America outline (simplified)
  [[-130, 50], [-125, 55], [-120, 60], [-140, 60], [-165, 65], [-168, 55], [-160, 55], [-150, 60], [-140, 55], [-130, 50]],
  [[-130, 50], [-125, 45], [-120, 35], [-115, 30], [-110, 25], [-105, 20], [-100, 20], [-95, 18], [-90, 20], [-85, 22], [-80, 25], [-75, 35], [-70, 42], [-65, 45], [-55, 48], [-60, 50], [-65, 48], [-70, 45], [-80, 45], [-85, 48], [-90, 48], [-95, 50], [-100, 50], [-110, 50], [-120, 50], [-130, 50]],
  // South America outline (simplified)
  [[-80, 10], [-75, 5], [-70, 5], [-60, 5], [-50, 0], [-45, -5], [-40, -10], [-38, -15], [-40, -22], [-45, -25], [-48, -28], [-55, -35], [-65, -40], [-70, -45], [-75, -50], [-70, -55], [-65, -55], [-68, -50], [-72, -42], [-73, -38], [-73, -30], [-75, -15], [-78, -5], [-80, 0], [-80, 10]],
  // Europe outline (simplified)
  [[-10, 36], [-5, 36], [0, 38], [5, 44], [0, 48], [-5, 48], [-10, 44], [-10, 36]],
  [[0, 48], [5, 48], [10, 55], [5, 55], [8, 58], [12, 56], [15, 55], [25, 55], [30, 60], [25, 65], [20, 65], [15, 68], [10, 63], [5, 62], [0, 52], [0, 48]],
  // Africa outline (simplified)
  [[-15, 30], [-10, 25], [-17, 15], [-15, 10], [-5, 5], [5, 5], [10, 2], [10, -5], [15, -5], [20, -10], [25, -15], [30, -20], [35, -25], [35, -30], [30, -35], [25, -35], [20, -30], [15, -25], [12, -18], [15, -10], [20, -5], [30, 0], [35, 5], [40, 10], [45, 12], [50, 12], [50, 8], [45, 0], [42, -5], [40, -10], [42, -15], [40, -20], [35, -25]],
  [[-15, 30], [-5, 36], [5, 37], [10, 35], [15, 32], [20, 33], [25, 32], [30, 32], [35, 30], [35, 25], [40, 15], [45, 12]],
  // Asia outline (simplified)
  [[30, 60], [40, 60], [50, 55], [60, 55], [70, 55], [80, 55], [90, 55], [100, 55], [110, 50], [120, 50], [130, 50], [140, 45], [145, 45], [140, 50], [135, 55], [140, 55], [150, 60], [160, 60], [170, 65], [180, 68]],
  [[25, 32], [30, 32], [35, 30], [40, 30], [45, 25], [50, 25], [55, 25], [60, 25], [65, 25], [70, 20], [75, 15], [80, 10], [85, 15], [90, 22], [95, 18], [100, 15], [105, 10], [110, 5], [115, 5], [120, 10], [120, 20], [125, 25], [130, 35], [135, 35], [130, 40], [125, 40], [120, 35], [120, 30], [115, 25], [110, 20], [105, 20], [100, 22], [95, 25], [90, 28], [85, 28], [80, 30], [75, 35], [70, 35], [65, 35], [60, 38], [55, 38], [50, 40], [45, 40], [40, 38], [35, 38], [30, 35]],
  // Australia outline (simplified)
  [[115, -25], [120, -20], [130, -15], [135, -12], [140, -15], [145, -15], [150, -22], [153, -28], [150, -35], [145, -38], [140, -38], [135, -35], [130, -32], [125, -33], [118, -35], [115, -34], [114, -28], [115, -25]],
];

export default function GlobeView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useApp();
  const [rotation, setRotation] = useState({ x: -0.3, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [hoveredVehicle, setHoveredVehicle] = useState<string | null>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.38;

    ctx.clearRect(0, 0, w, h);

    // Space background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, w, h);

    // Stars
    const seed = 42;
    for (let i = 0; i < 200; i++) {
      const sx = ((seed * (i + 1) * 7919) % w);
      const sy = ((seed * (i + 1) * 6271) % h);
      const brightness = 0.3 + ((i * 31) % 7) / 10;
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Globe atmosphere glow
    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.3);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.05)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Globe body
    const globeGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, 0, cx, cy, radius);
    globeGrad.addColorStop(0, '#1e3a5f');
    globeGrad.addColorStop(0.7, '#0f172a');
    globeGrad.addColorStop(1, '#020617');
    ctx.fillStyle = globeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // Grid lines
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
    ctx.lineWidth = 0.5;

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lng = -180; lng <= 180; lng += 5) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotation.y);
        p = rotateX(p, rotation.x);
        if (p.z > 0) {
          if (!started) {
            ctx.moveTo(cx + p.x, cy - p.y);
            started = true;
          } else {
            ctx.lineTo(cx + p.x, cy - p.y);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // Longitude lines
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 5) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotation.y);
        p = rotateX(p, rotation.x);
        if (p.z > 0) {
          if (!started) {
            ctx.moveTo(cx + p.x, cy - p.y);
            started = true;
          } else {
            ctx.lineTo(cx + p.x, cy - p.y);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // Draw coastlines
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    ctx.lineWidth = 1;

    for (const coast of COASTLINES) {
      ctx.beginPath();
      let started = false;
      for (const [lng, lat] of coast) {
        let p = latLngTo3D(lat, lng, radius);
        p = rotateY(p, rotation.y);
        p = rotateX(p, rotation.x);
        if (p.z > 0) {
          if (!started) {
            ctx.moveTo(cx + p.x, cy - p.y);
            started = true;
          } else {
            ctx.lineTo(cx + p.x, cy - p.y);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // Draw vehicles
    const vehiclePositions: { id: string; x: number; y: number; r: number }[] = [];

    for (const vehicle of state.vehicles) {
      let p = latLngTo3D(vehicle.lat, vehicle.lng, radius);
      p = rotateY(p, rotation.y);
      p = rotateX(p, rotation.x);

      if (p.z > 0) {
        const screenX = cx + p.x;
        const screenY = cy - p.y;
        const isHovered = hoveredVehicle === vehicle.id;
        const dotRadius = isHovered ? 7 : 5;

        const color =
          vehicle.status === 'active'
            ? '#4ade80'
            : vehicle.status === 'idle'
              ? '#facc15'
              : '#94a3b8';

        // Glow
        const glow = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, dotRadius * 3);
        glow.addColorStop(0, color + '60');
        glow.addColorStop(1, color + '00');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(screenX, screenY, dotRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        vehiclePositions.push({ id: vehicle.id, x: screenX, y: screenY, r: dotRadius * 3 });

        // Label for hovered
        if (isHovered) {
          const label = `${vehicle.name} (${vehicle.ownerName})`;
          ctx.font = '12px system-ui';
          const metrics = ctx.measureText(label);
          const lw = metrics.width + 16;
          const lh = 44;
          const lx = screenX - lw / 2;
          const ly = screenY - dotRadius - lh - 8;

          ctx.fillStyle = '#1e293bee';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(lx, ly, lw, lh, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f1f5f9';
          ctx.textAlign = 'center';
          ctx.fillText(label, screenX, ly + 18);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '10px system-ui';
          ctx.fillText(
            `${vehicle.type.toUpperCase()} | ${vehicle.speed > 0 ? vehicle.speed + ' mph' : 'Stationary'}`,
            screenX,
            ly + 34
          );
        }
      }
    }

    // Store positions for hover detection
    (canvas as unknown as Record<string, unknown>).__vehiclePositions = vehiclePositions;
  }, [rotation, state.vehicles, hoveredVehicle]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (autoRotate && !isDragging) {
        setRotation((r) => ({ ...r, y: r.y + 0.003 }));
      }
      draw();
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [autoRotate, isDragging, draw]);

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setRotation((r) => ({
        x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, r.x + dy * 0.005)),
        y: r.y + dx * 0.005,
      }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }

    // Check hover
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const positions = (canvas as unknown as Record<string, unknown>).__vehiclePositions as { id: string; x: number; y: number; r: number }[] | undefined;
    let found: string | null = null;
    if (positions) {
      for (const pos of positions) {
        const dist = Math.sqrt((mx - pos.x) ** 2 + (my - pos.y) ** 2);
        if (dist < pos.r) {
          found = pos.id;
          break;
        }
      }
    }
    setHoveredVehicle(found);
    canvas.style.cursor = found ? 'pointer' : isDragging ? 'grabbing' : 'grab';
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredVehicle(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-surface-700/50 bg-surface-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Globe View
            </h1>
            <p className="text-sm text-surface-400 mt-0.5">
              3D visualization of tracked vehicles worldwide
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`btn-secondary text-sm flex items-center gap-1 ${autoRotate ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : ''}`}
            >
              <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={autoRotate ? { animationDuration: '3s' } : {}} />
              Auto Rotate
            </button>
            <Link
              to="/map"
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <Map className="w-4 h-4" />
              Map View
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full"
        />

        {/* Vehicle Legend */}
        <div className="absolute bottom-4 right-4 card p-3 space-y-2">
          <p className="text-xs font-semibold text-surface-300">
            Vehicles ({state.vehicles.length})
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-xs text-surface-400">
                Active ({state.vehicles.filter((v) => v.status === 'active').length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="text-xs text-surface-400">
                Idle ({state.vehicles.filter((v) => v.status === 'idle').length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-surface-400" />
              <span className="text-xs text-surface-400">
                Maintenance ({state.vehicles.filter((v) => v.status === 'maintenance').length})
              </span>
            </div>
          </div>
          <p className="text-xs text-surface-500 pt-1 border-t border-surface-700/50">
            Click & drag to rotate
          </p>
        </div>
      </div>
    </div>
  );
}
