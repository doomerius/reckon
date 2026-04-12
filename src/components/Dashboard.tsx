import { Link } from 'react-router-dom';
import {
  Building2, Landmark, UserCircle, AlertTriangle, TrendingUp, Plane,
  Ship, ArrowUpRight, Clock, Shield,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import RiskBadge from './RiskBadge';

export default function Dashboard() {
  const { state } = useApp();
  const { entities, events, vehicles, alerts } = state;

  const corps = entities.filter((e) => e.type === 'corporation');
  const govs = entities.filter((e) => e.type === 'government');
  const people = entities.filter((e) => e.type === 'person');
  const highRisk = entities.filter((e) => e.riskScore >= 70).sort((a, b) => b.riskScore - a.riskScore);
  const activeVehicles = vehicles.filter((v) => v.status === 'active');
  const unreadAlerts = alerts.filter((a) => !a.read);
  const recentEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  const avgRisk = Math.round(entities.reduce((s, e) => s + e.riskScore, 0) / (entities.length || 1));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Operations Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Real-time overview of {entities.length} tracked entities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-xs mono" style={{ color: 'var(--text-secondary)' }}>LIVE</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Corporations', value: corps.length, icon: Building2, color: '#3b82f6' },
          { label: 'Governments', value: govs.length, icon: Landmark, color: '#a855f7' },
          { label: 'People', value: people.length, icon: UserCircle, color: '#34d399' },
          { label: 'High Risk', value: highRisk.length, icon: TrendingUp, color: '#f87171' },
          { label: 'Alerts', value: unreadAlerts.length, icon: AlertTriangle, color: '#fbbf24' },
          { label: 'Aircraft', value: vehicles.filter((v) => v.type === 'plane' || v.type === 'jet').length, icon: Plane, color: '#38bdf8' },
          { label: 'Vessels', value: vehicles.filter((v) => v.type === 'boat' || v.type === 'yacht').length, icon: Ship, color: '#06b6d4' },
        ].map((card) => (
          <div key={card.label} className="card p-3">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{card.label}</span>
            </div>
            <p className="stat-value text-2xl text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Risk Overview Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Risk Distribution</span>
          </div>
          <span className="text-xs mono" style={{ color: 'var(--text-tertiary)' }}>AVG: {avgRisk}</span>
        </div>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          {entities
            .sort((a, b) => a.riskScore - b.riskScore)
            .map((e) => (
              <div
                key={e.id}
                className="h-full rounded-full transition-all"
                style={{
                  flex: 1,
                  background:
                    e.riskScore >= 75 ? '#ef4444' :
                    e.riskScore >= 50 ? '#f97316' :
                    e.riskScore >= 25 ? '#eab308' : '#22c55e',
                  opacity: 0.7,
                }}
                title={`${e.name}: ${e.riskScore}`}
              />
            ))}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* High Risk Entities - takes 3 cols */}
        <div className="lg:col-span-3 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-white">Critical Watch List</span>
            </div>
            <Link to="/entities" className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1.5">
            {highRisk.slice(0, 6).map((entity, i) => (
              <Link
                key={entity.id}
                to={`/entities/${entity.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg transition-all"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="w-5 text-xs mono font-medium" style={{ color: 'var(--text-tertiary)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center`}
                  style={{ background: entity.type === 'corporation' ? 'rgba(59,130,246,0.12)' : entity.type === 'government' ? 'rgba(168,85,247,0.12)' : 'rgba(52,211,153,0.12)' }}>
                  {entity.type === 'corporation' ? <Building2 className="w-3.5 h-3.5 text-blue-400" /> :
                   entity.type === 'government' ? <Landmark className="w-3.5 h-3.5 text-purple-400" /> :
                   <UserCircle className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{entity.name}</p>
                  <p className="text-xs capitalize truncate" style={{ color: 'var(--text-tertiary)' }}>{entity.type}</p>
                </div>
                <RiskBadge score={entity.riskScore} size="sm" showLabel={false} />
              </Link>
            ))}
            {highRisk.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No critical entities</p>
            )}
          </div>
        </div>

        {/* Alerts - takes 2 cols */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">Active Alerts</span>
              {unreadAlerts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold mono bg-red-500/15 text-red-400 border border-red-500/20">
                  {unreadAlerts.length}
                </span>
              )}
            </div>
            <Link to="/alerts" className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {unreadAlerts.slice(0, 5).map((alert) => (
              <Link
                key={alert.id}
                to={`/entities/${alert.entityId}`}
                className="block p-2.5 rounded-lg border-l-2 transition-all"
                style={{
                  background: 'var(--bg-primary)',
                  borderLeftColor: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'high' ? '#f97316' : '#eab308',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`badge-${alert.severity}`}>{alert.severity}</span>
                  <span className="text-xs font-medium text-white truncate">{alert.entityName}</span>
                </div>
                <p className="text-xs line-clamp-1" style={{ color: 'var(--text-tertiary)' }}>
                  {alert.message}
                </p>
              </Link>
            ))}
            {unreadAlerts.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>All clear</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Events & Vehicle Status */}
      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm font-semibold text-white">Recent Events</span>
          </div>
          <div className="space-y-1">
            {recentEvents.map((event) => {
              const entity = entities.find((e) => e.id === event.entityId);
              return (
                <div key={event.id} className="flex items-start gap-3 p-2.5 rounded-lg"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    event.severity === 'critical' ? 'bg-red-400' :
                    event.severity === 'high' ? 'bg-orange-400' :
                    event.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{event.title}</span>
                      <span className={`badge-${event.severity} shrink-0`}>{event.severity}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {entity && (
                        <Link to={`/entities/${entity.id}`} className="text-xs text-blue-400 hover:text-blue-300">{entity.name}</Link>
                      )}
                      <span className="text-xs mono" style={{ color: 'var(--text-tertiary)' }}>
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {event.source && (
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{event.source}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Vehicles */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">Active Vehicles</span>
            </div>
            <Link to="/map" className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
              Track <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1.5">
            {activeVehicles.slice(0, 6).map((v) => (
              <Link
                key={v.id}
                to="/map"
                className="flex items-center gap-2.5 p-2 rounded-lg transition-all"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span className="live-dot" style={{ width: 6, height: 6 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{v.name}</p>
                  <p className="text-xs mono" style={{ color: 'var(--text-tertiary)' }}>{v.ownerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs mono text-emerald-400">{v.speed} {v.type === 'boat' || v.type === 'yacht' ? 'kts' : 'mph'}</p>
                  <p className="text-xs mono uppercase" style={{ color: 'var(--text-tertiary)' }}>{v.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
