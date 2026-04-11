import { useState } from 'react';
import {
  Newspaper,
  ExternalLink,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { getSimulatedNews } from '../utils/newsApi';
import type { NewsArticle } from '../types';

export default function NewsPanel() {
  const { state } = useApp();
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNews = (entityName?: string) => {
    setLoading(true);
    // Simulate network delay for realism
    setTimeout(() => {
      if (entityName) {
        setArticles(getSimulatedNews(entityName));
      } else {
        // Load news for all entities
        const allNews = state.entities
          .slice(0, 5)
          .flatMap((e) => getSimulatedNews(e.name))
          .sort(
            (a, b) =>
              new Date(b.publishedAt).getTime() -
              new Date(a.publishedAt).getTime()
          );
        setArticles(allNews);
      }
      setLoading(false);
    }, 500);
  };

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntity(entityId);
    if (entityId) {
      const entity = state.entities.find((e) => e.id === entityId);
      if (entity) {
        loadNews(entity.name);
      }
    } else {
      loadNews();
    }
  };

  // Load initial news on first render
  if (articles.length === 0 && !loading) {
    loadNews();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper className="w-6 h-6" />
            News Feed
          </h1>
          <p className="text-surface-400 mt-1">
            Latest news related to tracked entities
          </p>
        </div>
        <button
          onClick={() => {
            const entity = state.entities.find((e) => e.id === selectedEntity);
            loadNews(entity?.name);
          }}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Entity Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-surface-400" />
          <select
            value={selectedEntity}
            onChange={(e) => handleEntitySelect(e.target.value)}
            className="select-field flex-1"
          >
            <option value="">All Entities</option>
            {state.entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name} ({entity.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* API Key Notice */}
      <div className="card p-4 bg-blue-500/5 border-blue-500/20">
        <p className="text-sm text-blue-400">
          Showing simulated news. To use real news data, configure a NewsAPI key
          in the application settings.
        </p>
      </div>

      {/* Articles */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-surface-500 mx-auto animate-spin mb-3" />
          <p className="text-surface-400">Loading news...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <article key={article.id} className="card-hover p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white mb-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-surface-400 mb-3">
                    {article.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {article.source}
                    </span>
                    <span className="text-xs text-surface-500">
                      {new Date(article.publishedAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="p-2 rounded-lg bg-surface-700/50">
                    <ExternalLink className="w-4 h-4 text-surface-400" />
                  </div>
                </div>
              </div>
            </article>
          ))}

          {articles.length === 0 && !loading && (
            <div className="text-center py-12">
              <Newspaper className="w-12 h-12 text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400">No news articles found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
