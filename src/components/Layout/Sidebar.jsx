import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Activity, AlertTriangle, TrendingDown,
  Users, BookOpen, Zap, Building2, Bot, ChevronLeft,
  ChevronRight, Flame, Settings, Bell, LogOut, Cpu
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { path: '/predictive-maintenance', label: 'Predictive Maintenance', icon: Activity },
  { path: '/production-loss', label: 'Production Loss Analyzer', icon: TrendingDown },
  { path: '/root-cause', label: 'Root Cause Analysis', icon: AlertTriangle },
  { path: '/shift-intelligence', label: 'Shift Intelligence', icon: Users },
  { path: '/energy-analyzer', label: 'Energy Loss Analyzer', icon: Zap },
  { path: '/department-performance', label: 'Department Performance', icon: Building2 },
  { path: '/knowledge-vault', label: 'Knowledge Vault', icon: BookOpen },
  { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
];

export default function Sidebar({ user }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('ispat_user');
    navigate('/login');
  };

  return (
    <aside
      className={`relative flex flex-col h-full transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } bg-surface-850 border-r border-gray-800 flex-shrink-0`}
      style={{ background: 'rgba(9, 14, 28, 0.95)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #818cf8)' }}>
          <Flame size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-white text-sm tracking-wide">ISPAT AI</div>
            <div className="text-xs text-gray-500">Intelligence Platform</div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-600 transition-all z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 py-2 mb-1">
            Modules
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
              className={`w-full ${isActive ? 'nav-item-active' : 'nav-item'} ${
                collapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Icon size={18} className={isActive ? 'text-primary-400' : ''} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.path === '/ai-assistant' && (
                <span className="ml-auto px-1.5 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded-full font-semibold">AI</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-3 border-t border-gray-800 space-y-1 ${collapsed ? 'items-center' : ''}`}>
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-gray-500 truncate">{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-0' : ''}`}
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
