import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe, Filter, RefreshCw, Plane, Ship, Zap } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { Vehicle, VehicleType } from '../types';

// Custom SVG markers per vehicle type
function vehicleSVG(type: VehicleType, status: string, heading: number): string {
  const color = status === 'active' ? '#34d399' : status === 'idle' ? '#fbbf24' : '#64748b';
  const glow = status === 'active' ? '#34d39960' : status === 'idle' ? '#fbbf2440' : '#64748b30';

  if (type === 'plane' || type === 'jet') {
    return `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(${heading}deg)">
      <circle cx="18" cy="18" r="16" fill="${glow}" />
      <circle cx="18" cy="18" r="8" fill="#0a0e16" stroke="${color}" stroke-width="1.5"/>
      <path d="M18 10 L21 18 L18 16 L15 18 Z" fill="${color}"/>
      <path d="M14 20 L18 18 L22 20" fill="none" stroke="${color}" stroke-width="1"/>
    </svg>`;
  }
  return `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(${heading}deg)">
    <circle cx="18" cy="18" r="16" fill="${glow}" />
    <circle cx="18" cy="18" r="8" fill="#0a0e16" stroke="${color}" stroke-width="1.5"/>
    <path d="M15 13 L18 11 L21 13 L21 22 L18 24 L15 22 Z" fill="${color}" opacity="0.8"/>
    <line x1="14" y1="17" x2="22" y2="17" stroke="${color}" stroke-width="1"/>
  </svg>`;
}

function popupHTML(v: Vehicle): string {
  const color = v.status === 'active' ? '#34d399' : v.status === 'idle' ? '#fbbf24' : '#64748b';
  const speedUnit = v.type === 'boat' || v.type === 'yacht' ? 'kts' : 'mph';
  return `
    <div style="font-family:Inter,system-ui;min-width:220px;padding:4px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color}"></div>
        <span style="font-weight:600;font-size:14px;color:#e8edf5">${v.name}</span>
      </div>
      <table style="width:100%;font-size:11px;line-height:1.8;font-family:'JetBrains Mono',monospace">
        <tr><td style="color:#5a6478;padding-right:12px">Owner</td><td style="color:#8893a7">${v.ownerName}</td></tr>
        <tr><td style="color:#5a6478">Type</td><td style="color:#8893a7;text-transform:uppercase">${v.type}</td></tr>
        <tr><td style="color:#5a6478">Reg</td><td style="color:#8893a7">${v.registration}</td></tr>
        <tr><td style="color:#5a6478">Speed</td><td style="color:${color}">${v.speed > 0 ? v.speed + ' ' + speedUnit : 'Stationary'}</td></tr>
        ${v.altitude ? `<tr><td style="color:#5a6478">Alt</td><td style="color:#8893a7">${v.altitude.toLocaleString()} ft</td></tr>` : ''}
        <tr><td style="color:#5a6478">Hdg</td><td style="color:#8893a7">${Math.round(v.heading)}°</td></tr>
        <tr><td style="color:#5a6478">Pos</td><td style="color:#5a6478">${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}</td></tr>
      </table>
      <div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(56,72,100,0.3);font-size:10px;color:#5a6478">
        Updated ${new Date(v.lastUpdated).toLocaleTimeString()}
      </div>
    </div>`;
}

export default function MapView() {
  const { state } = useApp();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const filtered = state.vehicles.filter((v) => {
    const matchType = typeFilter === 'all' || v.type === typeFilter;
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchType && matchStatus;
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, {
      center: [30, 10],
      zoom: 3,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
    });

    // CartoDB Dark Matter - purpose-built dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filtered.forEach((vehicle) => {
      const icon = L.divIcon({
        className: '',
        html: vehicleSVG(vehicle.type, vehicle.status, vehicle.heading),
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([vehicle.lat, vehicle.lng], { icon })
        .addTo(mapInstance.current!);

      marker.bindPopup(popupHTML(vehicle), {
        className: 'custom-popup',
        maxWidth: 280,
      });

      marker.on('click', () => setSelectedVehicle(vehicle));
      markersRef.current.push(marker);
    });
  }, [filtered]);

  const flyTo = (v: Vehicle) => {
    if (!mapInstance.current) return;
    mapInstance.current.flyTo([v.lat, v.lng], 8, { duration: 1.5 });
    setSelectedVehicle(v);
  };

  const counts = {
    total: state.vehicles.length,
    active: state.vehicles.filter((v) => v.status === 'active').length,
    planes: state.vehicles.filter((v) => v.type === 'plane' || v.type === 'jet').length,
    ships: state.vehicles.filter((v) => v.type === 'boat' || v.type === 'yacht').length,
  };

  return (
    <div className="h-full flex">
      {/* Sidebar panel */}
      <div className="w-72 flex flex-col border-r" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h1 className="text-base font-semibold text-white tracking-tight mb-3">Vehicle Tracking</h1>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-surface)' }}>
              <p className="stat-value text-lg text-emerald-400">{counts.active}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Active</p>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-surface)' }}>
              <p className="stat-value text-lg text-white">{counts.total}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as VehicleType | 'all')} className="select-field text-xs py-1.5 flex-1">
              <option value="all">All Types</option>
              <option value="plane">Planes</option>
              <option value="jet">Jets</option>
              <option value="boat">Boats</option>
              <option value="yacht">Yachts</option>
            </select>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field text-xs py-1.5 w-full">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        {/* Vehicle list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((v) => (
            <button
              key={v.id}
              onClick={() => flyTo(v)}
              className={`w-full text-left p-2.5 rounded-lg transition-all text-xs ${selectedVehicle?.id === v.id ? 'ring-1 ring-blue-500/40' : ''}`}
              style={{
                background: selectedVehicle?.id === v.id ? 'var(--bg-elevated)' : 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = selectedVehicle?.id === v.id ? 'var(--bg-elevated)' : 'transparent')}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.status === 'active' ? 'bg-emerald-400' : v.status === 'idle' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                <span className="font-medium text-white truncate">{v.name}</span>
                <span className="ml-auto mono uppercase" style={{ color: 'var(--text-tertiary)', fontSize: 9 }}>{v.type}</span>
              </div>
              <div className="flex items-center gap-3 ml-3.5">
                <span className="mono" style={{ color: 'var(--text-tertiary)' }}>{v.registration}</span>
                <span className="mono" style={{ color: v.speed > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                  {v.speed > 0 ? `${v.speed} ${v.type === 'boat' || v.type === 'yacht' ? 'kts' : 'mph'}` : 'idle'}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-xs" style={{ color: 'var(--text-tertiary)' }}>No vehicles match filters</p>
          )}
        </div>

        {/* Footer links */}
        <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <Link to="/globe" className="btn-secondary text-xs py-1.5 px-3 flex-1 text-center flex items-center justify-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Globe
          </Link>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />

        {/* Stats overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(10, 14, 22, 0.85)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(8px)' }}>
            <span className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-blue-400" />
              <span className="mono font-medium text-white">{counts.planes}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>aircraft</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Ship className="w-3.5 h-3.5 text-cyan-400" />
              <span className="mono font-medium text-white">{counts.ships}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>vessels</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="mono font-medium text-emerald-400">{filtered.length}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>shown</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
