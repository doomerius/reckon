import { Link } from 'react-router-dom';
import { Bell, Check, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function AlertsPanel() {
  const { state, dispatch } = useApp();
  const { alerts } = state;
  const unread = alerts.filter((a) => !a.read);
  const read = alerts.filter((a) => a.read);

  const markRead = (id: string) => dispatch({ type: 'MARK_ALERT_READ', payload: id });
  const dismiss = (id: string) => dispatch({ type: 'DISMISS_ALERT', payload: id });
  const markAllRead = () => unread.forEach((a) => markRead(a.id));

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default: return <Info className="w-4 h-4 text-yellow-400" />;
    }
  };

  const borderColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      default: return '#22c55e';
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alerts
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            <span className="mono font-medium text-white">{unread.length}</span> unread of {alerts.length} total
          </p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Unread</h2>
          <div className="space-y-2">
            {unread.map((alert) => (
              <div key={alert.id} className="card p-4" style={{ borderLeft: `3px solid ${borderColor(alert.severity)}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {severityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/entities/${alert.entityId}`} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                          {alert.entityName}
                        </Link>
                        <span className={`badge-${alert.severity}`}>{alert.severity}</span>
                        <span className="text-xs mono" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(alert.createdAt)}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-4">
                    <button onClick={() => markRead(alert.id)} className="p-1.5 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                      title="Mark read">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => dismiss(alert.id)} className="p-1.5 rounded transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                      title="Dismiss">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>Read</h2>
          <div className="space-y-2">
            {read.map((alert) => (
              <div key={alert.id} className="card p-4 opacity-50" style={{ borderLeft: `3px solid ${borderColor(alert.severity)}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {severityIcon(alert.severity)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/entities/${alert.entityId}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                          {alert.entityName}
                        </Link>
                        <span className={`badge-${alert.severity}`}>{alert.severity}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
                    </div>
                  </div>
                  <button onClick={() => dismiss(alert.id)} className="p-1.5 rounded transition-colors shrink-0"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="text-center py-20">
          <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-tertiary)' }}>No alerts at this time</p>
        </div>
      )}
    </div>
  );
}
