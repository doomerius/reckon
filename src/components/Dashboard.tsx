import { Link } from 'react-router-dom';
import {
  Building2,
  Landmark,
  UserCircle,
  AlertTriangle,
  TrendingUp,
  Plane,
  Activity,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import RiskBadge from './RiskBadge';

export default function Dashboard() {
  const { state } = useApp();
  const { entities, events, vehicles, alerts } = state;

  const corps = entities.filter((e) => e.type === 'corporation');
  const govs = entities.filter((e) => e.type === 'government');
  const people = entities.filter((e) => e.type === 'person');
  const highRisk = entities
    .filter((e) => e.riskScore >= 70)
    .sort((a, b) => b.riskScore - a.riskScore);
  const activeVehicles = vehicles.filter((v) => v.status === 'active');
  const unreadAlerts = alerts.filter((a) => !a.read);
  const recentEvents = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const statCards = [
    {
      label: 'Corporations',
      value: corps.length,
      icon: Building2,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Governments',
      value: govs.length,
      icon: Landmark,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'People',
      value: people.length,
      icon: UserCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      label: 'Active Alerts',
      value: unreadAlerts.length,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'High Risk',
      value: highRisk.length,
      icon: TrendingUp,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Active Vehicles',
      value: activeVehicles.length,
      icon: Plane,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-surface-400 mt-1">
          Overview of tracked entities and active monitoring
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}
              >
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-surface-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* High Risk Entities */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              High Risk Entities
            </h2>
            <Link
              to="/entities"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {highRisk.map((entity) => (
              <Link
                key={entity.id}
                to={`/entities/${entity.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-900/50 hover:bg-surface-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      entity.type === 'corporation'
                        ? 'bg-blue-500/20'
                        : entity.type === 'government'
                          ? 'bg-purple-500/20'
                          : 'bg-emerald-500/20'
                    }`}
                  >
                    {entity.type === 'corporation' ? (
                      <Building2 className="w-4 h-4 text-blue-400" />
                    ) : entity.type === 'government' ? (
                      <Landmark className="w-4 h-4 text-purple-400" />
                    ) : (
                      <UserCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {entity.name}
                    </p>
                    <p className="text-xs text-surface-400 capitalize">
                      {entity.type}
                    </p>
                  </div>
                </div>
                <RiskBadge score={entity.riskScore} size="sm" />
              </Link>
            ))}
            {highRisk.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-4">
                No high-risk entities
              </p>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              Active Alerts
            </h2>
            <Link
              to="/alerts"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {unreadAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/5 border-red-500/20'
                    : alert.severity === 'high'
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`badge-${alert.severity}`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-surface-300 mt-1">
                  {alert.entityName}
                </p>
                <p className="text-xs text-surface-400 mt-0.5 line-clamp-2">
                  {alert.message}
                </p>
              </div>
            ))}
            {unreadAlerts.length === 0 && (
              <p className="text-sm text-surface-400 text-center py-4">
                No active alerts
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent Events
        </h2>
        <div className="space-y-3">
          {recentEvents.map((event) => {
            const entity = entities.find((e) => e.id === event.entityId);
            return (
              <div
                key={event.id}
                className="flex items-start gap-4 p-3 rounded-lg bg-surface-900/50"
              >
                <div
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    event.severity === 'critical'
                      ? 'bg-red-400'
                      : event.severity === 'high'
                        ? 'bg-orange-400'
                        : event.severity === 'medium'
                          ? 'bg-yellow-400'
                          : 'bg-green-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {event.title}
                    </p>
                    <span className={`badge-${event.severity} shrink-0`}>
                      {event.severity}
                    </span>
                  </div>
                  <p className="text-xs text-surface-400 line-clamp-1">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {entity && (
                      <Link
                        to={`/entities/${entity.id}`}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        {entity.name}
                      </Link>
                    )}
                    <span className="text-xs text-surface-500">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                    {event.source && (
                      <span className="text-xs text-surface-500">
                        {event.source}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
