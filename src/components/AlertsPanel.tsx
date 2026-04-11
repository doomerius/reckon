import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function AlertsPanel() {
  const { state, dispatch } = useApp();
  const { alerts } = state;

  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  const markRead = (id: string) =>
    dispatch({ type: 'MARK_ALERT_READ', payload: id });

  const dismiss = (id: string) =>
    dispatch({ type: 'DISMISS_ALERT', payload: id });

  const markAllRead = () => {
    unread.forEach((a) => markRead(a.id));
  };

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-green-400" />;
    }
  };

  const severityBorder = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-green-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Alerts
          </h1>
          <p className="text-surface-400 mt-1">
            {unread.length} unread, {alerts.length} total
          </p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <Check className="w-4 h-4 inline mr-1" />
            Mark all read
          </button>
        )}
      </div>

      {/* Unread Alerts */}
      {unread.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-300 mb-3 uppercase tracking-wider">
            Unread
          </h2>
          <div className="space-y-3">
            {unread.map((alert) => (
              <div
                key={alert.id}
                className={`card p-4 border-l-4 ${severityBorder(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {severityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/entities/${alert.entityId}`}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300"
                        >
                          {alert.entityName}
                        </Link>
                        <span className={`badge-${alert.severity}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-surface-300">
                        {alert.message}
                      </p>
                      <p className="text-xs text-surface-500 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    <button
                      onClick={() => markRead(alert.id)}
                      className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-white transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => dismiss(alert.id)}
                      className="p-1.5 rounded hover:bg-red-500/20 text-surface-400 hover:text-red-400 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Read Alerts */}
      {read.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-surface-300 mb-3 uppercase tracking-wider">
            Read
          </h2>
          <div className="space-y-3">
            {read.map((alert) => (
              <div
                key={alert.id}
                className={`card p-4 border-l-4 ${severityBorder(alert.severity)} opacity-60`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {severityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/entities/${alert.entityId}`}
                          className="text-sm font-medium text-blue-400 hover:text-blue-300"
                        >
                          {alert.entityName}
                        </Link>
                        <span className={`badge-${alert.severity}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-surface-300">
                        {alert.message}
                      </p>
                      <p className="text-xs text-surface-500 mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismiss(alert.id)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-surface-400 hover:text-red-400 transition-colors shrink-0 ml-4"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400">No alerts at this time</p>
        </div>
      )}
    </div>
  );
}
