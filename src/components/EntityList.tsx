import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Building2,
  Landmark,
  UserCircle,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import RiskBadge from './RiskBadge';
import type { EntityType } from '../types';

type SortField = 'name' | 'riskScore' | 'type' | 'updatedAt';

export default function EntityList() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [riskMin, setRiskMin] = useState(0);
  const [riskMax, setRiskMax] = useState(100);
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [tagFilter, setTagFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const allTags = Array.from(
    new Set(state.entities.flatMap((e) => e.tags))
  ).sort();

  const filtered = state.entities
    .filter((e) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || e.type === typeFilter;
      const matchRisk = e.riskScore >= riskMin && e.riskScore <= riskMax;
      const matchTag = !tagFilter || e.tags.includes(tagFilter);
      return matchSearch && matchType && matchRisk && matchTag;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'riskScore':
          cmp = a.riskScore - b.riskScore;
          break;
        case 'type':
          cmp = a.type.localeCompare(b.type);
          break;
        case 'updatedAt':
          cmp =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      dispatch({ type: 'DELETE_ENTITY', payload: id });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = sortDir === 'desc' ? SortDesc : SortAsc;

  const typeIcon = (type: string) => {
    switch (type) {
      case 'corporation':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'government':
        return <Landmark className="w-4 h-4 text-purple-400" />;
      default:
        return <UserCircle className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Entities</h1>
          <p className="text-surface-400 mt-1">
            {filtered.length} of {state.entities.length} entities
          </p>
        </div>
        <button
          onClick={() => navigate('/entities/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Entity
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities by name or description..."
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-surface-600' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid md:grid-cols-4 gap-4 pt-3 border-t border-surface-700/50">
            <div>
              <label className="text-xs text-surface-400 mb-1 block">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as EntityType | 'all')
                }
                className="select-field w-full"
              >
                <option value="all">All Types</option>
                <option value="corporation">Corporations</option>
                <option value="government">Governments</option>
                <option value="person">People</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-surface-400 mb-1 block">
                Min Risk Score
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={riskMin}
                onChange={(e) => setRiskMin(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 mb-1 block">
                Max Risk Score
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={riskMax}
                onChange={(e) => setRiskMax(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs text-surface-400 mb-1 block">
                Tag
              </label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="select-field w-full"
              >
                <option value="">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 text-xs text-surface-400">
        <span>Sort by:</span>
        {(['riskScore', 'name', 'type', 'updatedAt'] as SortField[]).map(
          (field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`px-2 py-1 rounded transition-colors ${
                sortField === field
                  ? 'bg-surface-700 text-white'
                  : 'hover:bg-surface-800'
              }`}
            >
              {field === 'riskScore'
                ? 'Risk'
                : field === 'updatedAt'
                  ? 'Updated'
                  : field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field && (
                <SortIcon className="w-3 h-3 inline ml-1" />
              )}
            </button>
          )
        )}
      </div>

      {/* Entity Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((entity) => (
          <Link
            key={entity.id}
            to={`/entities/${entity.id}`}
            className="card-hover p-4 block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {typeIcon(entity.type)}
                <span className="text-xs text-surface-400 capitalize">
                  {entity.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge score={entity.riskScore} size="sm" showLabel={false} />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(entity.id, entity.name);
                  }}
                  className="p-1 rounded hover:bg-red-500/20 text-surface-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              {entity.name}
            </h3>
            <p className="text-xs text-surface-400 line-clamp-2 mb-3">
              {entity.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {entity.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-surface-700/50 text-surface-300 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {entity.tags.length > 3 && (
                <span className="text-xs text-surface-500">
                  +{entity.tags.length - 3}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-surface-400">
            No entities match your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
