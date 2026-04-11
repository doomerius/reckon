export type EntityType = 'corporation' | 'government' | 'person';

export type VehicleType = 'plane' | 'jet' | 'boat' | 'yacht';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  description: string;
  riskScore: number;
  tags: string[];
  imageUrl?: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Corporation extends Entity {
  type: 'corporation';
  industry: string;
  revenue: string;
  headquarters: string;
  ceo: string;
  employees: number;
}

export interface Government extends Entity {
  type: 'government';
  country: string;
  leader: string;
  politicalSystem: string;
  gdp: string;
}

export interface Person extends Entity {
  type: 'person';
  title: string;
  organization: string;
  netWorth: string;
  nationality: string;
}

export type AnyEntity = Corporation | Government | Person;

export interface TimelineEvent {
  id: string;
  entityId: string;
  title: string;
  description: string;
  date: string;
  category: 'scandal' | 'financial' | 'legal' | 'political' | 'general';
  severity: AlertSeverity;
  source?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  ownerEntityId: string;
  ownerName: string;
  registration: string;
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  altitude?: number;
  status: 'active' | 'idle' | 'maintenance';
  lastUpdated: string;
}

export interface Alert {
  id: string;
  entityId: string;
  entityName: string;
  message: string;
  severity: AlertSeverity;
  read: boolean;
  createdAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  entityId?: string;
}

export interface RiskBreakdown {
  scandalScore: number;
  frequencyScore: number;
  financialScore: number;
  relationshipScore: number;
  total: number;
}

export interface AppState {
  entities: AnyEntity[];
  events: TimelineEvent[];
  vehicles: Vehicle[];
  alerts: Alert[];
  news: NewsArticle[];
  searchQuery: string;
  filterType: EntityType | 'all';
  filterRiskMin: number;
  filterRiskMax: number;
}
