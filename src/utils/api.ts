import type { NewsArticle, Vehicle } from '../types';

let isTauri = false;
let tauriInvoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;

async function initTauri() {
  try {
    const mod = await import('@tauri-apps/api/core');
    tauriInvoke = mod.invoke;
    isTauri = true;
  } catch {
    isTauri = false;
  }
}

initTauri();

async function fetchViaBackend(url: string): Promise<string> {
  if (isTauri && tauriInvoke) {
    return tauriInvoke('fetch_url', { url }) as Promise<string>;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ── RSS News Feeds ──────────────────────────────────────────

interface RSSSource {
  name: string;
  url: string;
  category: string;
}

const RSS_SOURCES: RSSSource[] = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'world' },
  { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml', category: 'business' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'world' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', category: 'world' },
  { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml', category: 'general' },
  { name: 'DW News', url: 'https://rss.dw.com/xml/rss-en-all', category: 'world' },
  { name: 'Reuters World', url: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best', category: 'world' },
];

function parseRSSXml(xml: string, sourceName: string): NewsArticle[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const items = doc.querySelectorAll('item');
    const articles: NewsArticle[] = [];

    items.forEach((item, i) => {
      if (i >= 10) return;
      const title = item.querySelector('title')?.textContent?.trim() || '';
      const description = item.querySelector('description')?.textContent?.trim() || '';
      const link = item.querySelector('link')?.textContent?.trim() || '';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';

      if (title) {
        articles.push({
          id: `rss-${sourceName}-${i}-${Date.now()}`,
          title: title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'),
          description: description
            .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
            .replace(/<[^>]*>/g, '')
            .slice(0, 300),
          url: link,
          source: sourceName,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        });
      }
    });

    return articles;
  } catch {
    return [];
  }
}

export async function fetchRSSNews(query?: string): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];
  const fetchPromises = RSS_SOURCES.map(async (source) => {
    try {
      const xml = await fetchViaBackend(source.url);
      const articles = parseRSSXml(xml, source.name);
      return articles;
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }

  let filtered = allArticles;
  if (query) {
    const q = query.toLowerCase();
    filtered = allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return filtered;
}

// ── OpenSky ADS-B Data ──────────────────────────────────────

interface OpenSkyState {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lng: number;
  altitude: number;
  onGround: boolean;
  velocity: number;
  heading: number;
  verticalRate: number;
}

export async function fetchADSBData(bounds?: [number, number, number, number]): Promise<Vehicle[]> {
  try {
    let raw: string;
    if (isTauri && tauriInvoke) {
      raw = await tauriInvoke('fetch_opensky', { bounds: bounds || null }) as string;
    } else {
      let url = 'https://opensky-network.org/api/states/all';
      if (bounds) {
        url += `?lamin=${bounds[0]}&lomin=${bounds[1]}&lamax=${bounds[2]}&lomax=${bounds[3]}`;
      }
      const res = await fetch(url);
      raw = await res.text();
    }

    const data = JSON.parse(raw);
    if (!data.states) return [];

    const states: OpenSkyState[] = data.states
      .filter((s: unknown[]) => s[5] != null && s[6] != null)
      .slice(0, 200)
      .map((s: unknown[]) => ({
        icao24: s[0] as string,
        callsign: ((s[1] as string) || '').trim(),
        originCountry: s[2] as string,
        lat: s[6] as number,
        lng: s[5] as number,
        altitude: ((s[13] as number) || (s[7] as number) || 0),
        onGround: s[8] as boolean,
        velocity: (s[9] as number) || 0,
        heading: (s[10] as number) || 0,
        verticalRate: (s[11] as number) || 0,
      }));

    return states
      .filter((s) => !s.onGround && s.velocity > 50)
      .map((s) => ({
        id: `adsb-${s.icao24}`,
        name: s.callsign || s.icao24.toUpperCase(),
        type: 'plane' as const,
        ownerEntityId: '',
        ownerName: s.originCountry,
        registration: s.icao24.toUpperCase(),
        lat: s.lat,
        lng: s.lng,
        heading: s.heading,
        speed: Math.round(s.velocity * 2.237),
        altitude: Math.round(s.altitude * 3.281),
        status: 'active' as const,
        lastUpdated: new Date().toISOString(),
      }));
  } catch (e) {
    console.warn('ADS-B fetch failed:', e);
    return [];
  }
}

// ── Marine AIS Simulated Feed ───────────────────────────────
// Real free AIS APIs are very limited; this generates realistic vessel data
// near major shipping lanes and ports

const SHIPPING_LANES: Array<{ name: string; positions: [number, number][] }> = [
  {
    name: 'English Channel',
    positions: [[-3.0, 50.2], [-1.0, 50.5], [1.0, 51.0], [2.5, 51.3]],
  },
  {
    name: 'Strait of Malacca',
    positions: [[99.5, 3.0], [101.0, 2.5], [103.0, 1.5], [104.5, 1.3]],
  },
  {
    name: 'Mediterranean',
    positions: [[-5.0, 36.0], [5.0, 37.0], [15.0, 36.5], [25.0, 35.0], [30.0, 33.0]],
  },
  {
    name: 'South China Sea',
    positions: [[106.0, 10.0], [110.0, 15.0], [114.0, 18.0], [118.0, 22.0]],
  },
  {
    name: 'Gulf of Mexico',
    positions: [[-97.0, 26.0], [-92.0, 27.0], [-88.0, 28.5], [-85.0, 25.0]],
  },
  {
    name: 'North Atlantic',
    positions: [[-74.0, 40.5], [-50.0, 45.0], [-20.0, 48.0], [-5.0, 50.0]],
  },
];

const VESSEL_NAMES = [
  'MSC Fantasia', 'Ever Given', 'Maersk Sealand', 'CMA Figaro', 'Nordic Spirit',
  'Pacific Voyager', 'Atlantic Star', 'Oriental Express', 'Golden Horizon', 'Silver Meridian',
  'Jade Pioneer', 'Coral Triumph', 'Royal Fortune', 'Neptune\'s Grace', 'Arctic Phoenix',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMarineVessels(): Vehicle[] {
  const hourSeed = Math.floor(Date.now() / 3600000);
  const rand = seededRandom(hourSeed);
  const vessels: Vehicle[] = [];

  SHIPPING_LANES.forEach((lane, laneIdx) => {
    const count = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const t = rand();
      const segIdx = Math.floor(t * (lane.positions.length - 1));
      const segT = (t * (lane.positions.length - 1)) - segIdx;
      const p1 = lane.positions[segIdx];
      const p2 = lane.positions[Math.min(segIdx + 1, lane.positions.length - 1)];
      const lng = p1[0] + (p2[0] - p1[0]) * segT + (rand() - 0.5) * 2;
      const lat = p1[1] + (p2[1] - p1[1]) * segT + (rand() - 0.5) * 1.5;
      const heading = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI + (rand() - 0.5) * 30;

      const nameIdx = (laneIdx * 3 + i) % VESSEL_NAMES.length;
      const isYacht = rand() > 0.7;

      vessels.push({
        id: `ais-${laneIdx}-${i}`,
        name: isYacht ? `M/Y ${VESSEL_NAMES[nameIdx].split(' ')[1]}` : VESSEL_NAMES[nameIdx],
        type: isYacht ? 'yacht' : 'boat',
        ownerEntityId: '',
        ownerName: lane.name + ' Traffic',
        registration: `IMO${7000000 + laneIdx * 1000 + i * 100 + Math.floor(rand() * 100)}`,
        lat,
        lng,
        heading: ((heading % 360) + 360) % 360,
        speed: isYacht ? Math.round(8 + rand() * 15) : Math.round(10 + rand() * 18),
        status: rand() > 0.15 ? 'active' : 'idle',
        lastUpdated: new Date(Date.now() - Math.floor(rand() * 600000)).toISOString(),
      });
    }
  });

  return vessels;
}
