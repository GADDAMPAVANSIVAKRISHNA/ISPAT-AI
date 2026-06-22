import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown, Cpu, Wifi, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const notifications = [
  { id: 1, type: 'critical', message: 'Conveyor M12: Bearing failure imminent (87% risk)', time: '2 min ago' },
  { id: 2, type: 'critical', message: 'Coke Oven COM-1: Temperature threshold exceeded', time: '8 min ago' },
  { id: 3, type: 'warning', message: 'Night shift efficiency below 75% target', time: '1 hr ago' },
  { id: 4, type: 'warning', message: 'Energy waste: 12.3% detected in Blast Furnace', time: '2 hr ago' },
  { id: 5, type: 'info', message: 'Predictive model retrained with latest sensor data', time: '3 hr ago' },
];

const pageTitles = {
  '/dashboard': { title: 'Executive Dashboard', sub: 'Plant Overview & KPIs' },
  '/predictive-maintenance': { title: 'Predictive Maintenance', sub: 'Machine Health & Failure Predictions' },
  '/production-loss': { title: 'Production Loss Analyzer', sub: 'Hidden Loss Detection & Analysis' },
  '/root-cause': { title: 'Root Cause Analysis', sub: 'AI-Powered Incident Investigation' },
  '/shift-intelligence': { title: 'Shift Intelligence Engine', sub: 'Shift Performance Analytics' },
  '/energy-analyzer': { title: 'Energy Loss Analyzer', sub: 'Energy Waste Detection' },
  '/department-performance': { title: 'Department Performance', sub: 'Cross-Department Analytics' },
  '/knowledge-vault': { title: 'Knowledge Vault', sub: 'Engineering Intelligence Library' },
  '/ai-assistant': { title: 'AI Assistant', sub: 'Ask anything about plant operations' },
};

export default function TopBar({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: 'ISPAT AI', sub: '' };
  const criticalCount = notifications.filter(n => n.type === 'critical').length;

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-gray-800 flex-shrink-0 relative"
      style={{ background: 'rgba(11, 15, 26, 0.95)', backdropFilter: 'blur(10px)' }}>

      {/* Page Title */}
      <div>
        <h1 className="text-lg font-bold text-white leading-tight">{pageInfo.title}</h1>
        <p className="text-xs text-gray-500">{pageInfo.sub}</p>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-gray-800">
          <Wifi size={12} className="text-emerald-400" />
          <span className="text-xs text-gray-400 font-mono">
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* System Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">System Online</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <Bell size={16} />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold critical-pulse">
                {criticalCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 card border-gray-700 shadow-2xl z-50 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white text-sm">Notifications</span>
                <span className="badge-critical">{criticalCount} Critical</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    notif.type === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                    notif.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
                    'bg-white/5 border-gray-800'
                  }`}>
                    <AlertCircle size={14} className={`mt-0.5 flex-shrink-0 ${
                      notif.type === 'critical' ? 'text-red-400' :
                      notif.type === 'warning' ? 'text-amber-400' : 'text-sky-400'
                    }`} />
                    <div>
                      <p className="text-xs text-gray-300 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-gray-800 cursor-pointer hover:border-gray-700 transition-all">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-white">{user.name}</div>
              <div className="text-xs text-gray-500">{user.role}</div>
            </div>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        )}
      </div>
    </header>
  );
}
