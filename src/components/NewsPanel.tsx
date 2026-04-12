import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, ExternalLink, Search, RefreshCw, Rss, Clock,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { fetchRSSNews } from '../utils/api';
import { getSimulatedNews } from '../utils/newsApi';
import type { NewsArticle } from '../types';

export default function NewsPanel() {
  const { state } = useApp();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [feedStatus, setFeedStatus] = useState<'live' | 'simulated' | 'loading'>('loading');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadNews = useCallback(async (entityName?: string) => {
    setLoading(true);
    setFeedStatus('loading');

    try {
      const rssArticles = await fetchRSSNews(entityName);
      if (rssArticles.length > 0) {
        setArticles(rssArticles);
        setFeedStatus('live');
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }
    } catch {
      // Fall through to simulated
    }

    // Fallback: simulated news
    const simulated = entityName
      ? getSimulatedNews(entityName)
      : state.entities.slice(0, 5).flatMap((e) => getSimulatedNews(e.name))
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    setArticles(simulated);
    setFeedStatus('simulated');
    setLastUpdated(new Date());
    setLoading(false);
  }, [state.entities]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntity(entityId);
    const entity = state.entities.find((e) => e.id === entityId);
    loadNews(entity?.name);
  };

  const filteredArticles = searchQuery
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  const sources = Array.from(new Set(articles.map((a) => a.source)));

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            News Intelligence
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Aggregated from {sources.length} sources
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Feed status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            {feedStatus === 'live' ? (
              <>
                <span className="live-dot" style={{ width: 6, height: 6 }} />
                <span className="text-emerald-400 mono font-medium">LIVE FEEDS</span>
              </>
            ) : feedStatus === 'simulated' ? (
              <>
                <Rss className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 mono font-medium">SIMULATED</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                <span className="mono" style={{ color: 'var(--text-tertiary)' }}>LOADING</span>
              </>
            )}
          </div>
          <button
            onClick={() => {
              const entity = state.entities.find((e) => e.id === selectedEntity);
              loadNews(entity?.name);
            }}
            disabled={loading}
            className="btn-secondary text-xs py-1.5 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={selectedEntity}
          onChange={(e) => handleEntitySelect(e.target.value)}
          className="select-field"
        >
          <option value="">All Entities</option>
          {state.entities.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {/* Source pills */}
      {sources.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sources:</span>
          {sources.map((src) => (
            <span key={src} className="px-2 py-0.5 rounded text-xs mono" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
              {src}
            </span>
          ))}
        </div>
      )}

      {/* Info banner */}
      {feedStatus === 'simulated' && (
        <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p className="text-blue-400">
            Showing simulated articles. Live RSS feeds are available when running as a desktop app via Tauri, which bypasses browser CORS restrictions.
          </p>
        </div>
      )}

      {/* Articles */}
      {loading ? (
        <div className="text-center py-16">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Fetching from news feeds...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredArticles.map((article) => (
            <a
              key={article.id}
              href={article.url !== '#' ? article.url : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover p-4 block group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {article.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-0.5 rounded text-xs mono font-medium" style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
                      {article.source}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <Clock className="w-3 h-3" />
                      {timeAgo(article.publishedAt)}
                    </span>
                  </div>
                </div>
                {article.url !== '#' && (
                  <ExternalLink className="w-4 h-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-tertiary)' }} />
                )}
              </div>
            </a>
          ))}
          {filteredArticles.length === 0 && !loading && (
            <div className="text-center py-16">
              <Newspaper className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p style={{ color: 'var(--text-tertiary)' }}>No articles found</p>
            </div>
          )}
        </div>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-xs text-center mono" style={{ color: 'var(--text-tertiary)' }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
