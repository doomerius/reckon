import type { NewsArticle } from '../types';

const NEWSAPI_BASE = 'https://newsapi.org/v2';

export async function fetchNews(
  query: string,
  apiKey: string
): Promise<NewsArticle[]> {
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `${NEWSAPI_BASE}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&apiKey=${encodeURIComponent(apiKey)}`
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();

    return (data.articles || []).map(
      (article: {
        title?: string;
        description?: string;
        url?: string;
        source?: { name?: string };
        publishedAt?: string;
      }, index: number) => ({
        id: `news-${Date.now()}-${index}`,
        title: article.title || 'Untitled',
        description: article.description || '',
        url: article.url || '#',
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt || new Date().toISOString(),
      })
    );
  } catch {
    console.error('Failed to fetch news');
    return [];
  }
}

// Simulated news for demo purposes when no API key is available
export function getSimulatedNews(entityName: string): NewsArticle[] {
  const templates = [
    {
      title: `${entityName} Faces New Regulatory Scrutiny`,
      description: `Government regulators have announced a new investigation into ${entityName}'s recent business practices and compliance measures.`,
      source: 'Reuters',
    },
    {
      title: `${entityName} Reports Quarterly Earnings`,
      description: `${entityName} released its quarterly financial report, revealing changes in revenue projections for the upcoming fiscal year.`,
      source: 'Bloomberg',
    },
    {
      title: `Leadership Changes at ${entityName}`,
      description: `${entityName} announced significant changes to its executive leadership team amid ongoing strategic restructuring.`,
      source: 'Financial Times',
    },
    {
      title: `${entityName} Expands Operations`,
      description: `${entityName} revealed plans to expand its global operations into new markets, signaling ambitious growth strategies.`,
      source: 'The Wall Street Journal',
    },
    {
      title: `Analysis: What ${entityName}'s Latest Move Means`,
      description: `Industry experts weigh in on ${entityName}'s recent decisions and their potential impact on the broader market landscape.`,
      source: 'The Economist',
    },
  ];

  const now = new Date();
  return templates.map((t, i) => ({
    id: `sim-news-${entityName}-${i}`,
    title: t.title,
    description: t.description,
    url: '#',
    source: t.source,
    publishedAt: new Date(
      now.getTime() - i * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));
}
