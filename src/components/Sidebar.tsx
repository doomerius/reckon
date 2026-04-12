import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Map, Globe, Bell, Newspaper, Shield,
} from 'lucide-react';
import { useApp } from '../store/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/entities', icon: Users, label: 'Entities' },
  { to: '/map', icon: Map, label: 'Map View' },
  { to: '/globe', icon: Globe, label: 'Globe View' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/news', icon: Newspaper, label: 'News' },
];

export default function Sidebar() {
  const { state } = useApp();
  const unreadAlerts = state.alerts.filter((a) => !a.read).length;
  const activeVehicles = state.vehicles.filter((v) => v.status === 'active').length;

  return (
    <aside className="w-60 flex flex-col h-full border-r" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
      {/* Brand */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">RECKON</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Entity Intelligence</p>
          </div>
        </div>
      </div>

      <div className="glow-line mx-4" />

      {/* Nav */}
      <nav className="flex-1 p-2 mt-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'text-white'
                  : 'hover:text-white'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: isActive ? '#e8edf5' : 'var(--text-secondary)',
              borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
            })}
          >
            <item.icon className="w-4 h-4 shrink-0" style={{ opacity: 0.7 }} />
            <span>{item.label}</span>
            {item.label === 'Alerts' && unreadAlerts > 0 && (
              <span className="ml-auto px-1.5 py-0.5 text-xs mono font-bold rounded bg-red-500/15 text-red-400 border border-red-500/20" style={{ fontSize: 9 }}>
                {unreadAlerts}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Status panel */}
      <div className="p-3">
        <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="live-dot" />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>System Online</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="stat-value text-white">{state.entities.length}</p>
              <p style={{ color: 'var(--text-tertiary)' }}>Entities</p>
            </div>
            <div>
              <p className="stat-value text-emerald-400">{activeVehicles}</p>
              <p style={{ color: 'var(--text-tertiary)' }}>Tracking</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
