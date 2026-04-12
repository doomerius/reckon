import { getRiskLevel } from '../utils/riskCalculator';

interface RiskBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function RiskBadge({ score, size = 'md', showLabel = true }: RiskBadgeProps) {
  const level = getRiskLevel(score);
  const color = score >= 75 ? '#f87171' : score >= 50 ? '#fb923c' : score >= 25 ? '#fbbf24' : '#4ade80';
  const bg = score >= 75 ? 'rgba(239,68,68,0.12)' : score >= 50 ? 'rgba(249,115,22,0.12)' : score >= 25 ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)';
  const border = score >= 75 ? 'rgba(239,68,68,0.2)' : score >= 50 ? 'rgba(249,115,22,0.2)' : score >= 25 ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md mono font-semibold ${sizeClasses[size]}`}
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      <span>{score}</span>
      {showLabel && <span className="font-normal opacity-60" style={{ fontSize: size === 'sm' ? 9 : 11 }}>{level}</span>}
    </span>
  );
}
