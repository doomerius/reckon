import {
  createContext, useContext, useReducer, useEffect, type ReactNode,
} from 'react';
import type { AnyEntity, TimelineEvent, Vehicle, Alert, NewsArticle, EntityType } from '../types';
import { sampleEntities, sampleEvents, sampleVehicles, sampleAlerts } from '../data/sampleData';
import { fetchADSBData, generateMarineVessels } from '../utils/api';

interface AppState {
  entities: AnyEntity[];
  events: TimelineEvent[];
  vehicles: Vehicle[];
  alerts: Alert[];
  news: NewsArticle[];
  searchQuery: string;
  filterType: EntityType | 'all';
  filterRiskMin: number;
  filterRiskMax: number;
  liveAircraft: Vehicle[];
  liveVessels: Vehicle[];
}

type Action =
  | { type: 'ADD_ENTITY'; payload: AnyEntity }
  | { type: 'UPDATE_ENTITY'; payload: AnyEntity }
  | { type: 'DELETE_ENTITY'; payload: string }
  | { type: 'ADD_EVENT'; payload: TimelineEvent }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER_TYPE'; payload: EntityType | 'all' }
  | { type: 'SET_FILTER_RISK'; payload: { min: number; max: number } }
  | { type: 'MARK_ALERT_READ'; payload: string }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'SET_NEWS'; payload: NewsArticle[] }
  | { type: 'UPDATE_VEHICLE'; payload: Vehicle }
  | { type: 'SET_LIVE_AIRCRAFT'; payload: Vehicle[] }
  | { type: 'SET_LIVE_VESSELS'; payload: Vehicle[] };

const initialState: AppState = {
  entities: sampleEntities,
  events: sampleEvents,
  vehicles: sampleVehicles,
  alerts: sampleAlerts,
  news: [],
  searchQuery: '',
  filterType: 'all',
  filterRiskMin: 0,
  filterRiskMax: 100,
  liveAircraft: [],
  liveVessels: [],
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_ENTITY':
      return { ...state, entities: [...state.entities, action.payload] };
    case 'UPDATE_ENTITY':
      return { ...state, entities: state.entities.map((e) => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_ENTITY':
      return {
        ...state,
        entities: state.entities.filter((e) => e.id !== action.payload),
        events: state.events.filter((e) => e.entityId !== action.payload),
        vehicles: state.vehicles.filter((v) => v.ownerEntityId !== action.payload),
        alerts: state.alerts.filter((a) => a.entityId !== action.payload),
      };
    case 'ADD_EVENT':
      return { ...state, events: [action.payload, ...state.events] };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.payload };
    case 'SET_FILTER_RISK':
      return { ...state, filterRiskMin: action.payload.min, filterRiskMax: action.payload.max };
    case 'MARK_ALERT_READ':
      return { ...state, alerts: state.alerts.map((a) => a.id === action.payload ? { ...a, read: true } : a) };
    case 'DISMISS_ALERT':
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.payload) };
    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] };
    case 'SET_NEWS':
      return { ...state, news: action.payload };
    case 'UPDATE_VEHICLE':
      return { ...state, vehicles: state.vehicles.map((v) => v.id === action.payload.id ? action.payload : v) };
    case 'SET_LIVE_AIRCRAFT':
      return { ...state, liveAircraft: action.payload };
    case 'SET_LIVE_VESSELS':
      return { ...state, liveVessels: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Fetch live ADS-B data periodically
  useEffect(() => {
    let cancelled = false;

    const fetchLive = async () => {
      try {
        const aircraft = await fetchADSBData();
        if (!cancelled && aircraft.length > 0) {
          dispatch({ type: 'SET_LIVE_AIRCRAFT', payload: aircraft });
        }
      } catch {
        // Silently fail - live data is optional
      }

      try {
        const vessels = generateMarineVessels();
        if (!cancelled) {
          dispatch({ type: 'SET_LIVE_VESSELS', payload: vessels });
        }
      } catch {
        // Silently fail
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 60000); // Refresh every 60s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
