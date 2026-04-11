import { getRiskLevel, getRiskColor, getRiskBgColor } from '../utils/riskCalculator';

interface RiskBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function RiskBadge({
  score,
  size = 'md',
  showLabel = true,
}: RiskBadgeProps) {
  const level = getRiskLevel(score);
  const color = getRiskColor(score);
  const bgColor = getRiskBgColor(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${bgColor} ${color} ${sizeClasses[size]}`}
    >
      <span>{score}</span>
      {showLabel && <span className="font-normal opacity-75">/ {level}</span>}
    </span>
  );
}
