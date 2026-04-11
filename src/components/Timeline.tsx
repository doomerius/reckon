import type { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-surface-400 text-center py-4">
        No events recorded
      </p>
    );
  }

  const categoryColors: Record<string, string> = {
    scandal: 'bg-red-400',
    financial: 'bg-yellow-400',
    legal: 'bg-orange-400',
    political: 'bg-purple-400',
    general: 'bg-blue-400',
  };

  const categoryIcons: Record<string, string> = {
    scandal: 'S',
    financial: 'F',
    legal: 'L',
    political: 'P',
    general: 'G',
  };

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-surface-700" />
      <div className="space-y-4">
        {sorted.map((event) => (
          <div key={event.id} className="relative pl-10">
            <div
              className={`absolute left-2.5 top-1 w-4 h-4 rounded-full ${categoryColors[event.category] || 'bg-surface-500'} flex items-center justify-center`}
            >
              <span className="text-[8px] font-bold text-black">
                {categoryIcons[event.category] || '?'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-900/50">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-white">
                  {event.title}
                </h4>
                <span className={`badge-${event.severity}`}>
                  {event.severity}
                </span>
              </div>
              <p className="text-xs text-surface-400">{event.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-surface-500">
                  {new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                {event.source && (
                  <span className="text-xs text-surface-500">
                    Source: {event.source}
                  </span>
                )}
                <span className="text-xs text-surface-500 capitalize px-1.5 py-0.5 bg-surface-800 rounded">
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
