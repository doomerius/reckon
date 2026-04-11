import type { AnyEntity, TimelineEvent, RiskBreakdown } from '../types';

export function calculateRiskBreakdown(
  entity: AnyEntity,
  events: TimelineEvent[]
): RiskBreakdown {
  const entityEvents = events.filter((e) => e.entityId === entity.id);

  // Scandal score: based on severity of scandal events
  const scandals = entityEvents.filter((e) => e.category === 'scandal');
  const scandalScore = Math.min(
    100,
    scandals.reduce((sum, s) => {
      const severityMap = { low: 10, medium: 25, high: 40, critical: 60 };
      return sum + severityMap[s.severity];
    }, 0)
  );

  // Frequency score: based on how many events in last 12 months
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentEvents = entityEvents.filter(
    (e) => new Date(e.date) > oneYearAgo
  );
  const frequencyScore = Math.min(100, recentEvents.length * 12);

  // Financial score: based on financial events severity
  const financialEvents = entityEvents.filter(
    (e) => e.category === 'financial'
  );
  const financialScore = Math.min(
    100,
    financialEvents.reduce((sum, f) => {
      const severityMap = { low: 8, medium: 20, high: 35, critical: 55 };
      return sum + severityMap[f.severity];
    }, 0)
  );

  // Relationship score: based on entity tags and metadata
  const relationshipScore = Math.min(100, entity.tags.length * 15);

  const total = Math.round(
    scandalScore * 0.35 +
      frequencyScore * 0.2 +
      financialScore * 0.25 +
      relationshipScore * 0.2
  );

  return {
    scandalScore: Math.round(scandalScore),
    frequencyScore: Math.round(frequencyScore),
    financialScore: Math.round(financialScore),
    relationshipScore: Math.round(relationshipScore),
    total: Math.min(100, total),
  };
}

export function getRiskLevel(score: number): string {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

export function getRiskColor(score: number): string {
  if (score >= 75) return 'text-red-400';
  if (score >= 50) return 'text-orange-400';
  if (score >= 25) return 'text-yellow-400';
  return 'text-green-400';
}

export function getRiskBgColor(score: number): string {
  if (score >= 75) return 'bg-red-500/20 border-red-500/30';
  if (score >= 50) return 'bg-orange-500/20 border-orange-500/30';
  if (score >= 25) return 'bg-yellow-500/20 border-yellow-500/30';
  return 'bg-green-500/20 border-green-500/30';
}
