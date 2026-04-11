import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EntityList from './components/EntityList';
import EntityDetail from './components/EntityDetail';
import EntityForm from './components/EntityForm';
import AlertsPanel from './components/AlertsPanel';
import MapView from './components/MapView';
import GlobeView from './components/GlobeView';
import NewsPanel from './components/NewsPanel';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="entities" element={<EntityList />} />
        <Route path="entities/new" element={<EntityForm />} />
        <Route path="entities/:id" element={<EntityDetail />} />
        <Route path="entities/:id/edit" element={<EntityForm />} />
        <Route path="alerts" element={<AlertsPanel />} />
        <Route path="map" element={<MapView />} />
        <Route path="globe" element={<GlobeView />} />
        <Route path="news" element={<NewsPanel />} />
      </Route>
    </Routes>
  );
}
