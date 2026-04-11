import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plane,
  Ship,
  Filter,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { VehicleType } from '../types';

const vehicleIcons: Record<VehicleType, string> = {
  plane: '✈',
  jet: '🛩',
  boat: '🚤',
  yacht: '🛥',
};

const statusColors: Record<string, string> = {
  active: '#4ade80',
  idle: '#facc15',
  maintenance: '#94a3b8',
};

export default function MapView() {
  const { state } = useApp();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [typeFilter, setTypeFilter] = useState<VehicleType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
      maxZoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filtered.forEach((vehicle) => {
      const icon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `<div style="
          background: ${statusColors[vehicle.status]};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 12px ${statusColors[vehicle.status]}80;
          border: 2px solid #0f172a;
          transform: rotate(${vehicle.heading}deg);
        ">${vehicleIcons[vehicle.type]}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([vehicle.lat, vehicle.lng], { icon }).addTo(
        mapInstance.current!
      );

      marker.bindPopup(`
        <div style="min-width: 200px; font-family: system-ui;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${vehicle.name}</div>
          <div style="font-size: 12px; opacity: 0.8; text-transform: capitalize; margin-bottom: 8px;">
            ${vehicle.type} - ${vehicle.status}
          </div>
          <div style="font-size: 12px; margin-bottom: 2px;">
            <strong>Owner:</strong> ${vehicle.ownerName}
          </div>
          <div style="font-size: 12px; margin-bottom: 2px;">
            <strong>Registration:</strong> ${vehicle.registration}
          </div>
          <div style="font-size: 12px; margin-bottom: 2px;">
            <strong>Speed:</strong> ${vehicle.speed} ${vehicle.type === 'boat' || vehicle.type === 'yacht' ? 'knots' : 'mph'}
          </div>
          ${vehicle.altitude ? `<div style="font-size: 12px; margin-bottom: 2px;"><strong>Altitude:</strong> ${vehicle.altitude.toLocaleString()} ft</div>` : ''}
          <div style="font-size: 12px; margin-bottom: 2px;">
            <strong>Position:</strong> ${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}
          </div>
          <div style="font-size: 11px; opacity: 0.6; margin-top: 4px;">
            Last updated: ${new Date(vehicle.lastUpdated).toLocaleString()}
          </div>
        </div>
      `);

      markersRef.current.push(marker);
    });
  }, [filtered]);

  const counts = {
    total: state.vehicles.length,
    active: state.vehicles.filter((v) => v.status === 'active').length,
    idle: state.vehicles.filter((v) => v.status === 'idle').length,
    maintenance: state.vehicles.filter((v) => v.status === 'maintenance')
      .length,
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-surface-700/50 bg-surface-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Map View
            </h1>
            <p className="text-sm text-surface-400 mt-0.5">
              {filtered.length} vehicles shown
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-surface-400" />
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as VehicleType | 'all')
                }
                className="select-field text-sm py-1.5"
              >
                <option value="all">All Types</option>
                <option value="plane">Planes</option>
                <option value="jet">Jets</option>
                <option value="boat">Boats</option>
                <option value="yacht">Yachts</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-field text-sm py-1.5"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="idle">Idle</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <Link
              to="/globe"
              className="btn-secondary text-sm flex items-center gap-1"
            >
              <Ship className="w-4 h-4" />
              Globe View
            </Link>
          </div>
        </div>

        {/* Status Stats */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-surface-400">
              Active: {counts.active}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-xs text-surface-400">
              Idle: {counts.idle}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-surface-400" />
            <span className="text-xs text-surface-400">
              Maintenance: {counts.maintenance}
            </span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1" />
    </div>
  );
}
