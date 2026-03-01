import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import VoCPage from './pages/VoCPage';
import ChannelPage from './pages/ChannelPage';
import CompetitorsPage from './pages/CompetitorsPage';
import ProductPage from './pages/ProductPage';
import PersonasPage from './pages/PersonasPage';
import InterventionsPage from './pages/InterventionsPage';
import SessionsPage from './pages/SessionsPage';
import AskPage from './pages/AskPage';
import { fetchBrands, Brand } from './api/client';

/* ── Brand Context ───────────────────────────────────────────── */

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

/* ── Theme Context ───────────────────────────────────────────── */

interface ThemeCtx {
  dark: boolean;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeCtx>({
  dark: false,
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/* ── App ─────────────────────────────────────────────────────── */

export default function App() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    fetchBrands()
      .then((data) => {
        setBrands(data);
        if (data.length > 0) setSelectedBrandId(data[0].id);
      })
      .catch(console.error);
  }, []);

  const toggle = () => setDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <BrandContext.Provider value={{ brands, selectedBrandId, setSelectedBrandId }}>
        <TooltipProvider delayDuration={200}>
          <ErrorBoundary>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/voc" element={<VoCPage />} />
                <Route path="/channels" element={<ChannelPage />} />
                <Route path="/competitors" element={<CompetitorsPage />} />
                <Route path="/products" element={<ProductPage />} />
                <Route path="/personas" element={<PersonasPage />} />
                <Route path="/interventions" element={<InterventionsPage />} />
                <Route path="/sessions" element={<SessionsPage />} />
                <Route path="/ask" element={<AskPage />} />
              </Route>
            </Routes>
          </ErrorBoundary>
        </TooltipProvider>
      </BrandContext.Provider>
    </ThemeContext.Provider>
  );
}
