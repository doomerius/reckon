import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Map,
  Globe,
  Bell,
  Newspaper,
  Shield,
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

  return (
    <aside className="w-64 bg-surface-900/80 border-r border-surface-700/50 flex flex-col h-full">
      <div className="p-5 border-b border-surface-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Reckon
            </h1>
            <p className="text-xs text-surface-400">Entity Tracker</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-surface-300 hover:bg-surface-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-4.5 h-4.5 shrink-0" />
            <span>{item.label}</span>
            {item.label === 'Alerts' && unreadAlerts > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-surface-700/50">
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-surface-300">
              System Active
            </span>
          </div>
          <p className="text-xs text-surface-400">
            Tracking {state.entities.length} entities,{' '}
            {state.vehicles.filter((v) => v.status === 'active').length} active
            vehicles
          </p>
        </div>
      </div>
    </aside>
  );
}
