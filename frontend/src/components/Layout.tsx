import { NavLink, Outlet } from 'react-router-dom';
import BrandSelector from './BrandSelector';

const navItems = [
  { to: '/', label: 'Overview', icon: '📊' },
  { to: '/voc', label: 'Non-Buyer Insights', icon: '👤' },
  { to: '/channels', label: 'Channel VoC', icon: '📢' },
  { to: '/competitors', label: 'Competitors', icon: '⚔️' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/personas', label: 'Personas', icon: '👥' },
  { to: '/interventions', label: 'Interventions', icon: '🔔' },
  { to: '/sessions/explorer', label: 'Sessions', icon: '📋' },
  { to: '/ask', label: 'Ask Customers', icon: '💬' },
];

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900 text-gray-300 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <span className="text-xl font-bold text-white tracking-tight">
            VoC Intelligence
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-500">
          Customer Datalake v1.0
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-700">Dashboard</h1>
          <BrandSelector />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
