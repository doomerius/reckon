import type { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

const categoryColors: Record<string, string> = {
  scandal: '#ef4444',
  financial: '#eab308',
  legal: '#f97316',
  political: '#a855f7',
  general: '#3b82f6',
};

export default function Timeline({ events }: TimelineProps) {
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) {
    return <p className="text-sm text-center py-6" style={{ color: 'var(--text-tertiary)' }}>No events recorded</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: 'var(--border-subtle)' }} />
      <div className="space-y-3">
        {sorted.map((event) => (
          <div key={event.id} className="relative pl-7">
            <div className="absolute left-0 top-2 w-[15px] h-[15px] rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-primary)', border: `2px solid ${categoryColors[event.category] || '#64748b'}` }}>
              <div className="w-[5px] h-[5px] rounded-full" style={{ background: categoryColors[event.category] || '#64748b' }} />
            </div>
            <div className="p-3 rounded-lg transition-colors"
              style={{ background: 'var(--bg-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-white">{event.title}</h4>
                <span className={`badge-${event.severity}`}>{event.severity}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{event.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs mono" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                {event.source && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{event.source}</span>}
                <span className="px-1.5 py-0.5 rounded text-xs mono capitalize" style={{ background: 'var(--bg-surface)', color: categoryColors[event.category] || 'var(--text-tertiary)', fontSize: 10 }}>
                  {event.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
