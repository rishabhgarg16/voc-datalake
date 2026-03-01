import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/export';
import { useBrand } from '@/App';
import { useTheme } from '@/App';
import BrandSelector from './BrandSelector';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  UserX,
  Radio,
  Swords,
  Package,
  Users,
  Bell,
  List,
  MessageCircle,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  CalendarDays,
  Download,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Overview', icon: BarChart3 },
  { to: '/voc', label: 'Non-Buyer Insights', icon: UserX },
  { to: '/channels', label: 'Channels', icon: Radio },
  { to: '/competitors', label: 'Competitors', icon: Swords },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/personas', label: 'Personas', icon: Users },
  { to: '/interventions', label: 'Interventions', icon: Bell },
  { to: '/sessions', label: 'Sessions', icon: List },
  { to: '/ask', label: 'Ask Customers', icon: MessageCircle },
];

function pageTitle(pathname: string): string {
  const match = navItems.find((item) =>
    item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
  );
  return match?.label ?? 'Dashboard';
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [exporting, setExporting] = useState(false);
  const { dark, toggle } = useTheme();
  const { selectedBrandId } = useBrand();
  const location = useLocation();

  const handleExport = async () => {
    if (!selectedBrandId || exporting) return;
    setExporting(true);
    const path = location.pathname;
    try {
      const endpointMap: Record<string, { url: string; filename: string; key: string }> = {
        '/': { url: `/api/brands/${selectedBrandId}/overview`, filename: 'overview', key: 'kpis' },
        '/voc': { url: `/api/brands/${selectedBrandId}/voc/intents`, filename: 'intents', key: 'intents' },
        '/channels': { url: `/api/brands/${selectedBrandId}/channel-voc`, filename: 'channels', key: 'channels' },
        '/competitors': { url: `/api/brands/${selectedBrandId}/voc/competitors`, filename: 'competitors', key: 'competitors' },
        '/products': { url: `/api/brands/${selectedBrandId}/products`, filename: 'products', key: 'products' },
        '/personas': { url: `/api/brands/${selectedBrandId}/voc/personas`, filename: 'personas', key: 'personas' },
        '/interventions': { url: `/api/brands/${selectedBrandId}/interventions`, filename: 'interventions', key: 'interventions' },
        '/sessions': { url: `/api/brands/${selectedBrandId}/sessions?page_size=500`, filename: 'sessions', key: 'sessions' },
      };
      const config = endpointMap[path];
      if (!config) {
        alert('Export not available for this page');
        return;
      }
      const res = await api.get(config.url);
      const data = res.data[config.key];
      if (Array.isArray(data)) {
        downloadCSV(data, config.filename);
      } else if (data && typeof data === 'object') {
        downloadCSV([data], config.filename);
      }
    } catch {
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex-shrink-0 flex flex-col border-r border-zinc-800/50 bg-zinc-950 text-zinc-400 transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-zinc-800/40">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold text-white truncate tracking-tight">
                VoC Intelligence
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const link = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-blue-600/90 text-white shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white'
                    )
                  }
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>
        </ScrollArea>

        {/* Collapse toggle + footer */}
        <div className="border-t border-zinc-800/40 px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed((c) => !c)}
            className="w-full justify-start gap-2 text-zinc-500 hover:text-white hover:bg-zinc-800/70"
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
          {!collapsed && (
            <p className="px-3 pt-2 text-[10px] text-zinc-600 select-none">
              Customer Datalake v1.0
            </p>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex-shrink-0 border-b border-border bg-card text-card-foreground flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-foreground">
              {pageTitle(location.pathname)}
            </h1>
            <Separator orientation="vertical" className="h-5" />
            {/* Live data indicator */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Live data
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <BrandSelector />
            {/* Date range selector */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px] h-8 text-xs text-foreground">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 text-foreground"
                  disabled={exporting}
                  onClick={handleExport}
                >
                  <Download className={cn("h-3.5 w-3.5", exporting && "animate-spin")} />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export current page data as CSV</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-6" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggle}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {dark ? 'Light mode' : 'Dark mode'}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1400px] mx-auto animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
