import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VoCPage from './pages/VoCPage';
import ChannelPage from './pages/ChannelPage';
import CompetitorsPage from './pages/CompetitorsPage';
import ProductPage from './pages/ProductPage';
import PersonasPage from './pages/PersonasPage';
import InterventionsPage from './pages/InterventionsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import AskPage from './pages/AskPage';
import { fetchBrands, Brand } from './api/client';

interface BrandCtx {
  brands: Brand[];
  selectedBrandId: number | null;
  setSelectedBrandId: (id: number) => void;
}

export const BrandContext = createContext<BrandCtx>({
  brands: [],
  selectedBrandId: null,
  setSelectedBrandId: () => {},
});

export const useBrand = () => useContext(BrandContext);

export default function App() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

  useEffect(() => {
    fetchBrands()
      .then((data) => {
        setBrands(data);
        if (data.length > 0) setSelectedBrandId(data[0].id);
      })
      .catch(console.error);
  }, []);

  return (
    <BrandContext.Provider value={{ brands, selectedBrandId, setSelectedBrandId }}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/voc" element={<VoCPage />} />
          <Route path="/channels" element={<ChannelPage />} />
          <Route path="/competitors" element={<CompetitorsPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/personas" element={<PersonasPage />} />
          <Route path="/interventions" element={<InterventionsPage />} />
          <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="/ask" element={<AskPage />} />
        </Route>
      </Routes>
    </BrandContext.Provider>
  );
}
