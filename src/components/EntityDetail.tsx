import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Building2,
  Landmark,
  UserCircle,
  ExternalLink,
  Calendar,
  Tag,
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
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-surface-400 text-lg">Entity not found</p>
          <Link to="/entities" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
            Back to entities
          </Link>
        </div>
      </div>
    );
  }

  const riskBreakdown = calculateRiskBreakdown(entity, state.events);
  const news = getSimulatedNews(entity.name);

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${entity.name}"?`)) {
      dispatch({ type: 'DELETE_ENTITY', payload: entity.id });
      navigate('/entities');
    }
  };

  const typeIcon =
    entity.type === 'corporation' ? (
      <Building2 className="w-5 h-5 text-blue-400" />
    ) : entity.type === 'government' ? (
      <Landmark className="w-5 h-5 text-purple-400" />
    ) : (
      <UserCircle className="w-5 h-5 text-emerald-400" />
    );

  const renderDetails = () => {
    switch (entity.type) {
      case 'corporation': {
        const corp = entity as Corporation;
        return (
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Industry" value={corp.industry} />
            <Detail label="Revenue" value={corp.revenue} />
            <Detail label="Headquarters" value={corp.headquarters} />
            <Detail label="CEO" value={corp.ceo} />
            <Detail label="Employees" value={corp.employees.toLocaleString()} />
          </div>
        );
      }
      case 'government': {
        const gov = entity as Government;
        return (
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Country" value={gov.country} />
            <Detail label="Leader" value={gov.leader} />
            <Detail label="System" value={gov.politicalSystem} />
            <Detail label="GDP" value={gov.gdp} />
          </div>
        );
      }
      case 'person': {
        const per = entity as Person;
        return (
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Title" value={per.title} />
            <Detail label="Organization" value={per.organization} />
            <Detail label="Net Worth" value={per.netWorth} />
            <Detail label="Nationality" value={per.nationality} />
          </div>
        );
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/entities')}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {typeIcon}
              <span className="text-sm text-surface-400 capitalize">
                {entity.type}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">{entity.name}</h1>
            <p className="text-surface-400 mt-1 max-w-2xl">
              {entity.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/entities/${entity.id}/edit`}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Entity Details */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
            {renderDetails()}
            {Object.keys(entity.metadata).length > 0 && (
              <>
                <div className="border-t border-surface-700/50 my-4" />
                <h3 className="text-sm font-medium text-surface-300 mb-3">
                  Additional Info
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(entity.metadata).map(([key, value]) => (
                    <Detail
                      key={key}
                      label={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      value={value}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-surface-400" />
              Timeline ({entityEvents.length} events)
            </h2>
            <Timeline events={entityEvents} />
          </div>

          {/* Related News */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4">
              Related News
            </h2>
            <div className="space-y-3">
              {news.map((article) => (
                <div
                  key={article.id}
                  className="p-3 rounded-lg bg-surface-900/50 hover:bg-surface-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {article.title}
                      </p>
                      <p className="text-xs text-surface-400 mt-1 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-surface-500">
                          {article.source}
                        </span>
                        <span className="text-xs text-surface-500">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-surface-500 shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Score */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-white mb-4">
              Risk Assessment
            </h2>
            <div className="text-center mb-4">
              <RiskBadge score={entity.riskScore} size="lg" />
            </div>
            <div className="space-y-3">
              <RiskBar
                label="Scandal"
                value={riskBreakdown.scandalScore}
                weight="35%"
              />
              <RiskBar
                label="Frequency"
                value={riskBreakdown.frequencyScore}
                weight="20%"
              />
              <RiskBar
                label="Financial"
                value={riskBreakdown.financialScore}
                weight="25%"
              />
              <RiskBar
                label="Relationships"
                value={riskBreakdown.relationshipScore}
                weight="20%"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-surface-400" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-surface-700/50 text-surface-300 rounded-lg text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Vehicles */}
          {entityVehicles.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-3">
                Tracked Vehicles
              </h2>
              <div className="space-y-2">
                {entityVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="p-2 rounded-lg bg-surface-900/50 flex items-center gap-3"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        v.status === 'active'
                          ? 'bg-green-400'
                          : v.status === 'idle'
                            ? 'bg-yellow-400'
                            : 'bg-surface-500'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-medium text-white">
                        {v.name}
                      </p>
                      <p className="text-xs text-surface-400 capitalize">
                        {v.type} - {v.registration}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/map"
                className="text-xs text-blue-400 hover:text-blue-300 mt-3 inline-block"
              >
                View on map
              </Link>
            </div>
          )}

          {/* Alerts */}
          {entityAlerts.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-white mb-3">
                Alerts ({entityAlerts.length})
              </h2>
              <div className="space-y-2">
                {entityAlerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="p-2 rounded-lg bg-surface-900/50"
                  >
                    <span className={`badge-${a.severity} mb-1`}>
                      {a.severity}
                    </span>
                    <p className="text-xs text-surface-400 mt-1 line-clamp-2">
                      {a.message}
                    </p>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-surface-400">{label}</p>
      <p className="text-sm font-medium text-white mt-0.5">{value}</p>
    </div>
  );
}

function RiskBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  const barColor =
    value >= 75
      ? 'bg-red-500'
      : value >= 50
        ? 'bg-orange-500'
        : value >= 25
          ? 'bg-yellow-500'
          : 'bg-green-500';

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-surface-300">{label}</span>
        <span className="text-surface-400">
          {value} <span className="text-surface-500">({weight})</span>
        </span>
      </div>
      <div className="h-1.5 bg-surface-900 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
