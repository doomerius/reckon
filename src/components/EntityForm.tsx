import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { EntityType, AnyEntity } from '../types';

export default function EntityForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const isEdit = id && id !== 'new';
  const existing = isEdit ? state.entities.find((e) => e.id === id) : null;

  const [entityType, setEntityType] = useState<EntityType>(existing?.type || 'corporation');
  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [tags, setTags] = useState(existing?.tags.join(', ') || '');
  const [riskScore, setRiskScore] = useState(existing?.riskScore || 50);

  const [industry, setIndustry] = useState('');
  const [revenue, setRevenue] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [ceo, setCeo] = useState('');
  const [employees, setEmployees] = useState('');
  const [country, setCountry] = useState('');
  const [leader, setLeader] = useState('');
  const [politicalSystem, setPoliticalSystem] = useState('');
  const [gdp, setGdp] = useState('');
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [netWorth, setNetWorth] = useState('');
  const [nationality, setNationality] = useState('');

  useEffect(() => {
    if (!existing) return;
    setEntityType(existing.type);
    setName(existing.name);
    setDescription(existing.description);
    setTags(existing.tags.join(', '));
    setRiskScore(existing.riskScore);
    if (existing.type === 'corporation') {
      const c = existing as Extract<AnyEntity, { type: 'corporation' }>;
      setIndustry(c.industry); setRevenue(c.revenue); setHeadquarters(c.headquarters); setCeo(c.ceo); setEmployees(String(c.employees));
    } else if (existing.type === 'government') {
      const g = existing as Extract<AnyEntity, { type: 'government' }>;
      setCountry(g.country); setLeader(g.leader); setPoliticalSystem(g.politicalSystem); setGdp(g.gdp);
    } else {
      const p = existing as Extract<AnyEntity, { type: 'person' }>;
      setTitle(p.title); setOrganization(p.organization); setNetWorth(p.netWorth); setNationality(p.nationality);
    }
  }, [existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const base = {
      id: isEdit ? id! : `${entityType.slice(0, 3)}-${Date.now()}`,
      name, description, riskScore, tags: parsedTags, metadata: {},
      createdAt: existing?.createdAt || now, updatedAt: now,
    };

    let entity: AnyEntity;
    switch (entityType) {
      case 'corporation': entity = { ...base, type: 'corporation', industry, revenue, headquarters, ceo, employees: Number(employees) || 0 }; break;
      case 'government': entity = { ...base, type: 'government', country, leader, politicalSystem, gdp }; break;
      case 'person': entity = { ...base, type: 'person', title, organization, netWorth, nationality }; break;
    }

    dispatch({ type: isEdit ? 'UPDATE_ENTITY' : 'ADD_ENTITY', payload: entity });
    navigate(`/entities/${entity.id}`);
  };

  const riskColor = riskScore >= 75 ? '#ef4444' : riskScore >= 50 ? '#f97316' : riskScore >= 25 ? '#eab308' : '#22c55e';

  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">{isEdit ? 'Edit Entity' : 'New Entity'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Basic Information</h2>
          {!isEdit && (
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Type</label>
              <select value={entityType} onChange={(e) => setEntityType(e.target.value as EntityType)} className="select-field w-full">
                <option value="corporation">Corporation</option>
                <option value="government">Government</option>
                <option value="person">Person</option>
              </select>
            </div>
          )}
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input-field" placeholder="Entity name" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field min-h-[80px] resize-y" placeholder="Brief description" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>Tags (comma-separated)</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="input-field" placeholder="finance, lobbying, tech" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>
              Risk Score: <span className="mono font-semibold" style={{ color: riskColor }}>{riskScore}</span>
            </label>
            <input type="range" min={0} max={100} value={riskScore} onChange={(e) => setRiskScore(Number(e.target.value))} className="w-full accent-blue-500" />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white capitalize">{entityType} Details</h2>
          {entityType === 'corporation' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Industry" value={industry} onChange={setIndustry} />
              <Field label="Revenue" value={revenue} onChange={setRevenue} />
              <Field label="Headquarters" value={headquarters} onChange={setHeadquarters} />
              <Field label="CEO" value={ceo} onChange={setCeo} />
              <Field label="Employees" value={employees} onChange={setEmployees} type="number" />
            </div>
          )}
          {entityType === 'government' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country" value={country} onChange={setCountry} />
              <Field label="Leader" value={leader} onChange={setLeader} />
              <Field label="Political System" value={politicalSystem} onChange={setPoliticalSystem} />
              <Field label="GDP" value={gdp} onChange={setGdp} />
            </div>
          )}
          {entityType === 'person' && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title" value={title} onChange={setTitle} />
              <Field label="Organization" value={organization} onChange={setOrganization} />
              <Field label="Net Worth" value={netWorth} onChange={setNetWorth} />
              <Field label="Nationality" value={nationality} onChange={setNationality} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Entity'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: 'var(--text-tertiary)' }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </div>
  );
}
