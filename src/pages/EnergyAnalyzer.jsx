import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Zap, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import { energyDailyData, energyWasteSources, energySummary, departmentEnergy } from '../data/energy';

export default function EnergyAnalyzer() {
  const [dailyReadings, setDailyReadings] = useState([]);
  const [wasteSources, setWasteSources] = useState([]);
  const [summary, setSummary] = useState(null);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [dailyRes, wasteRes, summaryRes, deptsRes] = await Promise.all([
          api.energy.getDaily(),
          api.energy.getWaste(),
          api.energy.getSummary(),
          api.energy.getDepartments()
        ]);
        if (active) {
          setDailyReadings(dailyRes);
          setWasteSources(wasteRes);
          setSummary(summaryRes);
          setDepts(deptsRes);
        }
      } catch (err) {
        console.error('Failed to fetch energy analytics:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchData();

    // Poll every 10 seconds for real-time energy updates
    const interval = setInterval(fetchData, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const activeSummary = summary || energySummary;
  const activeDaily = dailyReadings.length > 0 ? dailyReadings : energyDailyData;
  const activeWaste = wasteSources.length > 0 ? wasteSources : energyWasteSources;
  const activeDepts = depts.length > 0 ? depts : departmentEnergy;

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 mt-4 text-gray-400 text-sm">Analyzing energy meters...</span>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Consumed', value: `${activeSummary.totalConsumed.toLocaleString()} kWh`, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: Zap },
          { label: 'Total Wasted', value: `${activeSummary.totalWasted} MWh`, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: TrendingDown },
          { label: 'Waste Percentage', value: `${activeSummary.wastePercent}%`, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
          { label: 'Daily Cost Impact', value: activeSummary.costImpact, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: DollarSign },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`card border ${kpi.border} ${kpi.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} className={kpi.color} />
                <span className="text-xs text-gray-400">{kpi.label}</span>
              </div>
              <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Alert */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
        <AlertTriangle size={18} className="text-red-400 flex-shrink-0 animate-pulse" />
        <div>
          <p className="text-sm font-semibold text-white">Top Energy Waste: {activeSummary.topCause}</p>
          <p className="text-xs text-gray-400">Fix idle conveyor operations to save ₹74,000/day. Estimated CO₂ reduction: {activeSummary.co2Saved}.</p>
        </div>
      </div>

      {/* Energy Timeline Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">24-Hour Energy Consumption vs Production Output</h2>
            <p className="text-xs text-gray-500">Energy (kWh) mapped against production output (Tons)</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={activeDaily} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="prodGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
            <Area yAxisId="left" type="monotone" dataKey="consumed" stroke="#f59e0b" strokeWidth={2} fill="url(#energyGrad)" name="Energy (kWh)" />
            <Area yAxisId="right" type="monotone" dataKey="produced" stroke="#0ea5e9" strokeWidth={2} fill="url(#prodGrad2)" name="Production (T)" />
            <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Waste Sources */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4">Energy Waste Sources</h2>
          <div className="space-y-4">
            {activeWaste.map((source, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-300 font-medium">{source.source}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white font-mono">{source.waste} MWh</span>
                    <span className="text-xs text-gray-500 font-mono">{source.cost}/day</span>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(source.waste / 25) * 100}%`, background: source.color || '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Energy */}
        <div className="card">
          <h2 className="text-base font-bold text-white mb-4">Department Energy Efficiency</h2>
          <div className="space-y-3">
            {activeDepts.map((dept, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/2 border border-gray-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{dept.dept}</span>
                    <span className={`text-xs font-bold ${dept.efficiency >= 88 ? 'text-emerald-400' : dept.efficiency >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                      {dept.efficiency}% efficient
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${dept.efficiency}%`,
                        background: dept.efficiency >= 88 ? '#10b981' : dept.efficiency >= 80 ? '#f59e0b' : '#ef4444'
                      }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
                    <span>{dept.consumed.toLocaleString()} kWh consumed</span>
                    <span className="text-red-400">{dept.waste}% wasted</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
