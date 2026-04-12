import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Building2, Landmark, UserCircle, Filter,
  SortAsc, SortDesc, Trash2, ArrowUpRight,
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

  const allTags = Array.from(new Set(state.entities.flatMap((e) => e.tags))).sort();

  const filtered = state.entities
    .filter((e) => {
      const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || e.type === typeFilter;
      const matchRisk = e.riskScore >= riskMin && e.riskScore <= riskMax;
      const matchTag = !tagFilter || e.tags.includes(tagFilter);
      return matchSearch && matchType && matchRisk && matchTag;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'riskScore': cmp = a.riskScore - b.riskScore; break;
        case 'type': cmp = a.type.localeCompare(b.type); break;
        case 'updatedAt': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      dispatch({ type: 'DELETE_ENTITY', payload: id });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = sortDir === 'desc' ? SortDesc : SortAsc;

  const typeIcon = (type: string) => {
    const style = type === 'corporation' ? { bg: 'rgba(59,130,246,0.12)', color: 'text-blue-400' }
      : type === 'government' ? { bg: 'rgba(168,85,247,0.12)', color: 'text-purple-400' }
      : { bg: 'rgba(52,211,153,0.12)', color: 'text-emerald-400' };
    const Icon = type === 'corporation' ? Building2 : type === 'government' ? Landmark : UserCircle;
    return (
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: style.bg }}>
        <Icon className={`w-4 h-4 ${style.color}`} />
      </div>
    );
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Entities</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            <span className="mono font-medium text-white">{filtered.length}</span> of {state.entities.length} entities
          </p>
        </div>
        <button onClick={() => navigate('/entities/new')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Entity
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities..." className="input-field pl-9" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-1.5 text-xs ${showFilters ? '!border-blue-500/30 !text-blue-400' : ''}`}>
            <Filter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>
        {showFilters && (
          <div className="grid md:grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as EntityType | 'all')} className="select-field w-full text-xs">
                <option value="all">All Types</option>
                <option value="corporation">Corporations</option>
                <option value="government">Governments</option>
                <option value="person">People</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Min Risk</label>
              <input type="number" min={0} max={100} value={riskMin} onChange={(e) => setRiskMin(Number(e.target.value))} className="input-field text-xs" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Max Risk</label>
              <input type="number" min={0} max={100} value={riskMax} onChange={(e) => setRiskMax(Number(e.target.value))} className="input-field text-xs" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Tag</label>
              <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="select-field w-full text-xs">
                <option value="">All Tags</option>
                {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <span>Sort:</span>
        {(['riskScore', 'name', 'type', 'updatedAt'] as SortField[]).map((field) => (
          <button key={field} onClick={() => toggleSort(field)}
            className={`px-2 py-1 rounded transition-colors ${sortField === field ? 'text-white' : ''}`}
            style={{ background: sortField === field ? 'var(--bg-elevated)' : 'transparent' }}>
            {field === 'riskScore' ? 'Risk' : field === 'updatedAt' ? 'Updated' : field.charAt(0).toUpperCase() + field.slice(1)}
            {sortField === field && <SortIcon className="w-3 h-3 inline ml-0.5" />}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((entity) => (
          <div key={entity.id} className="card-hover p-4 group relative">
            <Link to={`/entities/${entity.id}`} className="block">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {typeIcon(entity.type)}
                  <span className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{entity.type}</span>
                </div>
                <RiskBadge score={entity.riskScore} size="sm" showLabel={false} />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{entity.name}</h3>
              <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-tertiary)' }}>{entity.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {entity.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-xs mono" style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)', fontSize: 10 }}>{tag}</span>
                ))}
                {entity.tags.length > 3 && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>+{entity.tags.length - 3}</span>}
              </div>
            </Link>
            {/* Actions overlay */}
            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link to={`/entities/${entity.id}`} className="p-1 rounded" style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <button onClick={() => handleDelete(entity.id, entity.name)} className="p-1 rounded"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p style={{ color: 'var(--text-tertiary)' }}>No entities match your criteria.</p>
        </div>
      )}
    </div>
  );
}
