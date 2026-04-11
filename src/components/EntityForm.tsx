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

  const [entityType, setEntityType] = useState<EntityType>(
    existing?.type || 'corporation'
  );
  const [name, setName] = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [tags, setTags] = useState(existing?.tags.join(', ') || '');
  const [riskScore, setRiskScore] = useState(existing?.riskScore || 50);

  // Corporation fields
  const [industry, setIndustry] = useState('');
  const [revenue, setRevenue] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [ceo, setCeo] = useState('');
  const [employees, setEmployees] = useState('');

  // Government fields
  const [country, setCountry] = useState('');
  const [leader, setLeader] = useState('');
  const [politicalSystem, setPoliticalSystem] = useState('');
  const [gdp, setGdp] = useState('');

  // Person fields
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [netWorth, setNetWorth] = useState('');
  const [nationality, setNationality] = useState('');

  useEffect(() => {
    if (existing) {
      setEntityType(existing.type);
      setName(existing.name);
      setDescription(existing.description);
      setTags(existing.tags.join(', '));
      setRiskScore(existing.riskScore);

      if (existing.type === 'corporation') {
        const c = existing as Extract<AnyEntity, { type: 'corporation' }>;
        setIndustry(c.industry);
        setRevenue(c.revenue);
        setHeadquarters(c.headquarters);
        setCeo(c.ceo);
        setEmployees(String(c.employees));
      } else if (existing.type === 'government') {
        const g = existing as Extract<AnyEntity, { type: 'government' }>;
        setCountry(g.country);
        setLeader(g.leader);
        setPoliticalSystem(g.politicalSystem);
        setGdp(g.gdp);
      } else {
        const p = existing as Extract<AnyEntity, { type: 'person' }>;
        setTitle(p.title);
        setOrganization(p.organization);
        setNetWorth(p.netWorth);
        setNationality(p.nationality);
      }
    }
  }, [existing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const base = {
      id: isEdit ? id! : `${entityType.slice(0, 3)}-${Date.now()}`,
      name,
      description,
      riskScore,
      tags: parsedTags,
      metadata: {},
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    let entity: AnyEntity;
    switch (entityType) {
      case 'corporation':
        entity = {
          ...base,
          type: 'corporation',
          industry,
          revenue,
          headquarters,
          ceo,
          employees: Number(employees) || 0,
        };
        break;
      case 'government':
        entity = {
          ...base,
          type: 'government',
          country,
          leader,
          politicalSystem,
          gdp,
        };
        break;
      case 'person':
        entity = {
          ...base,
          type: 'person',
          title,
          organization,
          netWorth,
          nationality,
        };
        break;
    }

    if (isEdit) {
      dispatch({ type: 'UPDATE_ENTITY', payload: entity });
    } else {
      dispatch({ type: 'ADD_ENTITY', payload: entity });
    }

    navigate(`/entities/${entity.id}`);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">
          {isEdit ? 'Edit Entity' : 'New Entity'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">
            Basic Information
          </h2>

          {!isEdit && (
            <div>
              <label className="text-sm text-surface-300 mb-1 block">
                Entity Type
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as EntityType)}
                className="select-field w-full"
              >
                <option value="corporation">Corporation</option>
                <option value="government">Government</option>
                <option value="person">Person</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-sm text-surface-300 mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
              placeholder="Entity name"
            />
          </div>

          <div>
            <label className="text-sm text-surface-300 mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Brief description of the entity"
            />
          </div>

          <div>
            <label className="text-sm text-surface-300 mb-1 block">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field"
              placeholder="e.g., finance, lobbying, tech"
            />
          </div>

          <div>
            <label className="text-sm text-surface-300 mb-1 block">
              Risk Score: {riskScore}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={riskScore}
              onChange={(e) => setRiskScore(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-surface-500 mt-1">
              <span>0 - Low</span>
              <span>25 - Medium</span>
              <span>50 - High</span>
              <span>75 - Critical</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Type-Specific Fields */}
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white capitalize">
            {entityType} Details
          </h2>

          {entityType === 'corporation' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Technology"
                  />
                </div>
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Revenue
                  </label>
                  <input
                    type="text"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="input-field"
                    placeholder="e.g., $50B"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Headquarters
                  </label>
                  <input
                    type="text"
                    value={headquarters}
                    onChange={(e) => setHeadquarters(e.target.value)}
                    className="input-field"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    CEO
                  </label>
                  <input
                    type="text"
                    value={ceo}
                    onChange={(e) => setCeo(e.target.value)}
                    className="input-field"
                    placeholder="CEO name"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-surface-300 mb-1 block">
                  Employees
                </label>
                <input
                  type="number"
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  className="input-field"
                  placeholder="Number of employees"
                />
              </div>
            </>
          )}

          {entityType === 'government' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Country
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input-field"
                    placeholder="Country name"
                  />
                </div>
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Leader
                  </label>
                  <input
                    type="text"
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    className="input-field"
                    placeholder="Head of state"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Political System
                  </label>
                  <input
                    type="text"
                    value={politicalSystem}
                    onChange={(e) => setPoliticalSystem(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Federal Republic"
                  />
                </div>
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    GDP
                  </label>
                  <input
                    type="text"
                    value={gdp}
                    onChange={(e) => setGdp(e.target.value)}
                    className="input-field"
                    placeholder="e.g., $500B"
                  />
                </div>
              </div>
            </>
          )}

          {entityType === 'person' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    placeholder="e.g., CEO, President"
                  />
                </div>
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="input-field"
                    placeholder="Associated organization"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Net Worth
                  </label>
                  <input
                    type="text"
                    value={netWorth}
                    onChange={(e) => setNetWorth(e.target.value)}
                    className="input-field"
                    placeholder="e.g., $5B"
                  />
                </div>
                <div>
                  <label className="text-sm text-surface-300 mb-1 block">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="input-field"
                    placeholder="Nationality"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Create Entity'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
