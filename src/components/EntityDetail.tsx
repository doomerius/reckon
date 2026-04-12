import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Building2, Landmark, UserCircle, ExternalLink,
  Calendar, Tag, Ship, Plane,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import RiskBadge from './RiskBadge';
import Timeline from './Timeline';
import { calculateRiskBreakdown } from '../utils/riskCalculator';
import { getSimulatedNews } from '../utils/newsApi';
import type { Corporation, Government, Person } from '../types';

export default function EntityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const entity = state.entities.find((e) => e.id === id);
  const entityEvents = state.events.filter((e) => e.entityId === id);
  const entityVehicles = state.vehicles.filter((v) => v.ownerEntityId === id);
  const entityAlerts = state.alerts.filter((a) => a.entityId === id);

  if (!entity) {
    return (
      <div className="p-6 text-center py-20">
        <p style={{ color: 'var(--text-tertiary)' }} className="text-lg">Entity not found</p>
        <Link to="/entities" className="text-blue-400 hover:text-blue-300 mt-2 inline-block text-sm">Back to entities</Link>
      </div>
    );
  }

  const riskBreakdown = calculateRiskBreakdown(entity, state.events);
  const news = getSimulatedNews(entity.name);

  const handleDelete = () => {
    if (confirm(`Delete "${entity.name}"? This cannot be undone.`)) {
      dispatch({ type: 'DELETE_ENTITY', payload: entity.id });
      navigate('/entities');
    }
  };

  const typeIcon = entity.type === 'corporation'
    ? <Building2 className="w-4 h-4 text-blue-400" />
    : entity.type === 'government'
      ? <Landmark className="w-4 h-4 text-purple-400" />
      : <UserCircle className="w-4 h-4 text-emerald-400" />;

  const renderDetails = () => {
    switch (entity.type) {
      case 'corporation': {
        const c = entity as Corporation;
        return [
          ['Industry', c.industry], ['Revenue', c.revenue],
          ['Headquarters', c.headquarters], ['CEO', c.ceo],
          ['Employees', c.employees.toLocaleString()],
        ];
      }
      case 'government': {
        const g = entity as Government;
        return [
          ['Country', g.country], ['Leader', g.leader],
          ['System', g.politicalSystem], ['GDP', g.gdp],
        ];
      }
      case 'person': {
        const p = entity as Person;
        return [
          ['Title', p.title], ['Organization', p.organization],
          ['Net Worth', p.netWorth], ['Nationality', p.nationality],
        ];
      }
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/entities')} className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {typeIcon}
              <span className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{entity.type}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{entity.name}</h1>
            <p className="text-sm mt-1 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>{entity.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/entities/${entity.id}/edit`} className="btn-secondary flex items-center gap-1.5 text-xs">
            <Edit className="w-3.5 h-3.5" /> Edit
          </Link>
          <button onClick={handleDelete} className="btn-danger flex items-center gap-1.5 text-xs">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Details */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {renderDetails().map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                  <p className="text-sm font-medium text-white mt-0.5 mono">{value}</p>
                </div>
              ))}
            </div>
            {Object.keys(entity.metadata).length > 0 && (
              <>
                <div className="glow-line my-4" />
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(entity.metadata).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      </p>
                      <p className="text-sm font-medium text-white mt-0.5 mono">{value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              Timeline
              <span className="mono text-xs" style={{ color: 'var(--text-tertiary)' }}>({entityEvents.length})</span>
            </h2>
            <Timeline events={entityEvents} />
          </div>

          {/* News */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Related News</h2>
            <div className="space-y-2">
              {news.map((article) => (
                <div key={article.id} className="p-3 rounded-lg transition-colors" style={{ background: 'var(--bg-primary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}>
                  <p className="text-sm font-medium text-white">{article.title}</p>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{article.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-1.5 py-0.5 rounded text-xs mono" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa', fontSize: 10 }}>{article.source}</span>
                    <span className="text-xs mono" style={{ color: 'var(--text-tertiary)' }}>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    <ExternalLink className="w-3 h-3 ml-auto" style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Risk */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Risk Assessment</h2>
            <div className="text-center mb-5">
              <RiskBadge score={entity.riskScore} size="lg" />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Scandal', value: riskBreakdown.scandalScore, weight: '35%' },
                { label: 'Frequency', value: riskBreakdown.frequencyScore, weight: '20%' },
                { label: 'Financial', value: riskBreakdown.financialScore, weight: '25%' },
                { label: 'Relationships', value: riskBreakdown.relationshipScore, weight: '20%' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span className="mono" style={{ color: 'var(--text-tertiary)' }}>{item.value} <span style={{ opacity: 0.5 }}>({item.weight})</span></span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${item.value}%`,
                      background: item.value >= 75 ? '#ef4444' : item.value >= 50 ? '#f97316' : item.value >= 25 ? '#eab308' : '#22c55e',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} /> Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {entity.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-md text-xs mono" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Vehicles */}
          {entityVehicles.length > 0 && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                {entityVehicles[0].type === 'boat' || entityVehicles[0].type === 'yacht'
                  ? <Ship className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  : <Plane className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />}
                Vehicles ({entityVehicles.length})
              </h2>
              <div className="space-y-2">
                {entityVehicles.map((v) => (
                  <div key={v.id} className="p-2 rounded-lg flex items-center gap-3" style={{ background: 'var(--bg-primary)' }}>
                    <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-emerald-400' : v.status === 'idle' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                    <div>
                      <p className="text-xs font-medium text-white">{v.name}</p>
                      <p className="text-xs mono" style={{ color: 'var(--text-tertiary)' }}>{v.type.toUpperCase()} | {v.registration}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/map" className="text-xs text-blue-400 hover:text-blue-300 mt-3 inline-block">Track on map</Link>
            </div>
          )}

          {/* Alerts */}
          {entityAlerts.length > 0 && (
            <div className="card p-5">
              <h2 className="text-xs font-semibold text-white mb-3">Alerts ({entityAlerts.length})</h2>
              <div className="space-y-2">
                {entityAlerts.slice(0, 3).map((a) => (
                  <div key={a.id} className="p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                    <span className={`badge-${a.severity}`}>{a.severity}</span>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{a.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
