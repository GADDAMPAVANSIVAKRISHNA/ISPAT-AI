import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingDown, TrendingUp, Activity, Clock, Zap,
  AlertTriangle, ChevronRight, ArrowUpRight, ArrowDownRight,
  Cpu, Target, BarChart3, Flame
} from 'lucide-react';
import { api } from '../services/api';
import { dailyProduction, todayProduction, monthlyTrend } from '../data/production';
import { machines } from '../data/machines';

const COLORS_LOSS = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

const ICON_MAP = {
  BarChart3: BarChart3,
  Clock: Clock,
  AlertTriangle: AlertTriangle,
  Zap: Zap,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-gray-400 text-xs mb-2 font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value} T</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const res = await api.dashboard.getSummary();
        if (active) {
          setData(res);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        if (active && !data) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchData();

    // Poll every 10 seconds for real-time changes
    const interval = setInterval(fetchData, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Use actual data if fetched, fallback to mock data otherwise
  const today = data?.todayProduction || todayProduction;
  const criticalMachines = data?.criticalMachines || machines.filter(m => m.status === 'critical');
  const dailyProd = data?.dailyProduction || dailyProduction;
  const monthlyTrendData = data?.monthlyTrend || monthlyTrend;
  const machinesList = data?.machines || machines;
  const dbPredictions = data?.predictions || [
    {
      label: "Tomorrow's Production Forecast",
      value: '985 Tons',
      subvalue: '-1.5% vs target',
      icon: 'BarChart3',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      detail: 'Prophet + LSTM ensemble model',
    },
    {
      label: 'Expected Downtime Tomorrow',
      value: '3.8 Hours',
      subvalue: 'Above SLA threshold',
      icon: 'Clock',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      detail: 'XGBoost downtime predictor',
    },
    {
      label: 'Next Failure: Conveyor M12',
      value: '7 Days',
      subvalue: '87% failure probability',
      icon: 'AlertTriangle',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      detail: 'Random Forest + LSTM RUL model',
    },
    {
      label: 'Potential Energy Savings',
      value: '₹1.99L/day',
      subvalue: 'By fixing idle conveyors',
      icon: 'Zap',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      detail: 'Energy optimization model',
    },
  ];

  const kpis = [
    {
      label: "Today's Production",
      value: `${today.actual}T`,
      sub: `Target: ${today.target}T`,
      icon: Cpu,
      change: '-15%',
      changeType: 'down',
      color: 'from-sky-500/20 to-blue-500/10',
      border: 'border-sky-500/20',
      iconColor: 'text-sky-400',
    },
    {
      label: 'Total Loss Today',
      value: `${today.loss}T`,
      sub: `${today.target > 0 ? ((today.loss / today.target) * 100).toFixed(1) : 0}% of target`,
      icon: TrendingDown,
      change: '+25%',
      changeType: 'up',
      color: 'from-red-500/20 to-red-500/5',
      border: 'border-red-500/20',
      iconColor: 'text-red-400',
    },
    {
      label: 'Plant Efficiency',
      value: `${today.efficiency}%`,
      sub: 'Target: 92%',
      icon: Target,
      change: '-7%',
      changeType: 'down',
      color: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      label: 'Downtime Today',
      value: `${today.downtime}h`,
      sub: 'SLA: Max 2h/day',
      icon: Clock,
      change: `+${today.downtime}h`,
      changeType: 'up',
      color: 'from-purple-500/20 to-purple-500/5',
      border: 'border-purple-500/20',
      iconColor: 'text-purple-400',
    },
  ];

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 mt-4 text-gray-400 text-sm">Loading plant dashboard...</span>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Alert Banner */}
      {criticalMachines.length > 0 && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl border border-red-500/30 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-all"
          onClick={() => navigate('/predictive-maintenance')}>
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-red-400 critical-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-400">
              ⚡ {criticalMachines.length} Critical Machine Alert{criticalMachines.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {criticalMachines.map(m => m.name).join(' • ')} — Immediate action required
            </p>
          </div>
          <ChevronRight size={16} className="text-red-400 flex-shrink-0" />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`kpi-card bg-gradient-to-br ${kpi.color} border ${kpi.border}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.iconColor} bg-white/5`}>
                  <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                  kpi.changeType === 'up' && kpi.label !== "Today's Production" && kpi.label !== 'Plant Efficiency'
                    ? 'bg-red-500/20 text-red-400'
                    : kpi.changeType === 'down' && (kpi.label === 'Total Loss Today' || kpi.label === 'Downtime Today')
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {kpi.changeType === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {kpi.change}
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-1">{kpi.value}</div>
              <div className="text-sm font-semibold text-gray-300 mb-0.5">{kpi.label}</div>
              <div className="text-xs text-gray-500">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Production Trend Chart */}
        <div className="chart-container xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Production Trend</h2>
              <p className="text-xs text-gray-500">Last 7 days — Target vs Actual (Tons)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-primary-400" /><span className="text-gray-400">Target</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-emerald-400" /><span className="text-gray-400">Actual</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-red-400" /><span className="text-gray-400">Loss</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyProd} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="target" stroke="#0ea5e9" strokeWidth={2} fill="url(#colorTarget)" name="Target" dot={false} strokeDasharray="5 5" />
              <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} fill="url(#colorActual)" name="Actual" dot={{ fill: '#10b981', r: 3 }} />
              <Area type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={1.5} fill="url(#colorLoss)" name="Loss" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Loss Breakdown Donut */}
        <div className="chart-container">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">Loss Breakdown</h2>
            <p className="text-xs text-gray-500">Today — by category</p>
          </div>
          {today.lossBreakdown && today.lossBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={today.lossBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="tons" nameKey="category" strokeWidth={0}>
                    {today.lossBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color || COLORS_LOSS[index % COLORS_LOSS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [`${val}T`, name]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {today.lossBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color || COLORS_LOSS[i % COLORS_LOSS.length] }} />
                      <span className="text-gray-400 truncate">{item.category}</span>
                    </div>
                    <span className="text-white font-semibold">{item.tons}T</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-xs text-gray-500">
              No losses recorded today.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Critical Machines */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Critical Machine Alerts</h2>
            <button onClick={() => navigate('/predictive-maintenance')}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {machinesList.filter(m => m.status !== 'healthy').slice(0, 4).map((machine) => (
              <div key={machine.id}
                className="flex items-center gap-4 p-3 rounded-xl border border-gray-800 hover:border-gray-700 transition-all bg-white/2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  machine.status === 'critical' ? 'bg-red-500/15' : 'bg-amber-500/15'
                }`}>
                  <Activity size={18} className={machine.status === 'critical' ? 'text-red-400' : 'text-amber-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{machine.name}</span>
                    <span className={`badge ${machine.status === 'critical' ? 'badge-critical' : 'badge-warning'}`}>
                      {machine.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{machine.department} • {machine.recommendedAction}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-black ${machine.failureProbability >= 70 ? 'text-red-400' : 'text-amber-400'}`}>
                    {machine.failureProbability}%
                  </div>
                  <div className="text-xs text-gray-500">risk</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Predictions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">AI Predictions</h2>
            <div className="badge-info">ML Models Active</div>
          </div>
          <div className="space-y-3">
            {dbPredictions.map((pred, i) => {
              const Icon = typeof pred.icon === 'string' ? (ICON_MAP[pred.icon] || BarChart3) : pred.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 hover:border-gray-700 transition-all">
                  <div className={`w-9 h-9 rounded-xl ${pred.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} className={pred.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate">{pred.label}</p>
                    <p className="text-xs text-gray-600">{pred.detail}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-black ${pred.color}`}>{pred.value}</div>
                    <div className="text-xs text-gray-600">{pred.subvalue}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
