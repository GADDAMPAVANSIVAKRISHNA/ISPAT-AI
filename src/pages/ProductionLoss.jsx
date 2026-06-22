import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingDown, Package, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { dailyProduction, todayProduction, monthlyTrend } from '../data/production';

const LOSS_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'];

export default function ProductionLoss() {
  const [today, setToday] = useState(null);
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [todayRes, dailyRes, monthlyRes] = await Promise.all([
          api.production.getToday(),
          api.production.getDaily(),
          api.production.getMonthly()
        ]);
        if (active) {
          setToday(todayRes);
          setDaily(dailyRes);
          setMonthly(monthlyRes);
        }
      } catch (err) {
        console.error('Failed to fetch production loss statistics:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchData();

    // Poll every 10 seconds for real-time sensor updates
    const interval = setInterval(fetchData, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const activeToday = today || todayProduction;
  const activeDaily = daily.length > 0 ? daily : dailyProduction;
  const activeMonthly = monthly.length > 0 ? monthly : monthlyTrend;

  // Compute breakdown values
  const equipmentLoss = activeToday.lossBreakdown?.find(b => b.category.includes('Equipment') || b.category.includes('Conveyor'))?.tons || 60;
  const shiftLoss = activeToday.lossBreakdown?.find(b => b.category.includes('Shift'))?.tons || 40;
  const materialLoss = activeToday.lossBreakdown?.find(b => b.category.includes('Material'))?.tons || 30;

  if (loading && !today) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 mt-4 text-gray-400 text-sm">Analyzing production losses...</span>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Loss Today', value: `${activeToday.loss}T`, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: TrendingDown },
          { label: 'Loss Due to Equipment', value: `${equipmentLoss}T`, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertCircle },
          { label: 'Loss Due to Shift Delay', value: `${shiftLoss}T`, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Clock },
          { label: 'Loss Due to Material', value: `${materialLoss}T`, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: Package },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={`card border ${item.border} ${item.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={item.color} />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
              <div className={`text-3xl font-black ${item.color}`}>{item.value}</div>
            </div>
          );
        })}
      </div>

      {/* Loss Breakdown + Pie Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Donut + breakdown table */}
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4">Loss Category Breakdown</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={activeToday.lossBreakdown} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="tons" strokeWidth={0}>
                  {activeToday.lossBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color || LOSS_COLORS[index % LOSS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}T`]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {activeToday.lossBreakdown.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color || LOSS_COLORS[i % LOSS_COLORS.length] }} />
                      <span className="text-gray-300 font-medium">{item.category}</span>
                    </div>
                    <span className="text-white font-bold">{item.tons}T</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.percent}%`, background: item.color || LOSS_COLORS[i % LOSS_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly production bar */}
        <div className="chart-container">
          <h2 className="text-base font-bold text-white mb-1">Weekly Production vs Target</h2>
          <p className="text-xs text-gray-500 mb-4">Last 7 days — Tons</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activeDaily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="target" fill="rgba(14,165,233,0.25)" name="Target" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" fill="#10b981" name="Actual" radius={[4, 4, 0, 0]} />
              <Bar dataKey="loss" fill="#ef4444" name="Loss" radius={[4, 4, 0, 0]} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="chart-container animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Monthly Production Trend</h2>
            <p className="text-xs text-gray-500">Jan — Jun 2026 (Tons)</p>
          </div>
          <div className="badge-warning">June: High Loss Month</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={activeMonthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLossTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
            <Area type="monotone" dataKey="production" stroke="#10b981" strokeWidth={2} fill="url(#colorProduction)" name="Production (T)" />
            <Area type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={1.5} fill="url(#colorLossTrend)" name="Loss (T)" />
            <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
