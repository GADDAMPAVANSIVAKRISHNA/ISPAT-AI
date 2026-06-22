import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Building2, TrendingUp, TrendingDown, Minus, AlertTriangle, Trophy } from 'lucide-react';
import { api } from '../services/api';
import { departments, deptWeeklyComparison } from '../data/departments';

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  stable: 'text-gray-400',
};

export default function DepartmentPerformance() {
  const [depts, setDepts] = useState([]);
  const [weeklyComp, setWeeklyComp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [deptsRes, weeklyRes] = await Promise.all([
          api.departments.getAll(),
          api.departments.getWeekly()
        ]);
        if (active) {
          setDepts(deptsRes);
          setWeeklyComp(weeklyRes);
        }
      } catch (err) {
        console.error('Failed to fetch department performance metrics:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchData();

    // Poll every 10 seconds for department performance ticks
    const interval = setInterval(fetchData, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const activeDepts = depts.length > 0 ? depts : departments;
  const activeWeekly = weeklyComp.length > 0 ? weeklyComp : deptWeeklyComparison;

  const sorted = [...activeDepts].sort((a, b) => b.efficiency - a.efficiency);

  if (loading && depts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 mt-4 text-gray-400 text-sm">Aggregating department KPIs...</span>
      </div>
    );
  }

  const bestPerformer = sorted[0] || { name: 'Power Plant', efficiency: 91, head: 'Suresh Patil', incidents: 1, downtime: 1.2 };
  const worstPerformer = sorted[sorted.length - 1] || { name: 'Maintenance', efficiency: 71, head: 'Amit Sharma', issues: ['2 critical machines overdue'] };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Top/Bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top performer */}
        <div className="card border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center gap-3 mb-3">
            <Trophy size={20} className="text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Top Performing</span>
          </div>
          <div className="text-2xl font-black text-white">{bestPerformer.name}</div>
          <div className="text-4xl font-black text-emerald-400 mt-1">{bestPerformer.efficiency}%</div>
          <div className="text-xs text-gray-500 mt-1">Head: {bestPerformer.head}</div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="badge-success">{bestPerformer.incidents} incidents</span>
            <span>{bestPerformer.downtime}h downtime</span>
          </div>
        </div>

        {/* Lowest performer */}
        <div className="card border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={20} className="text-red-400" />
            <span className="text-sm font-semibold text-red-400 uppercase tracking-wider">Needs Attention</span>
          </div>
          <div className="text-2xl font-black text-white">{worstPerformer.name}</div>
          <div className="text-4xl font-black text-red-400 mt-1">{worstPerformer.efficiency}%</div>
          <div className="text-xs text-gray-500 mt-1">Head: {worstPerformer.head}</div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
            {worstPerformer.issues && worstPerformer.issues.length > 0 ? (
              worstPerformer.issues.map((issue, i) => (
                <span key={i} className="badge-critical text-xs">{issue}</span>
              ))
            ) : (
              <span className="badge-warning text-xs">Unresolved shift incident backlogs</span>
            )}
          </div>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sorted.map((dept, i) => {
          const TrendIcon = trendIcons[dept.trend] || Minus;
          return (
            <div key={dept.id} className="card border border-gray-800 hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
                    style={{ background: `${dept.color || '#ef4444'}20`, border: `1px solid ${dept.color || '#ef4444'}30`, color: dept.color || '#ef4444' }}>
                    #{i + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{dept.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{dept.head}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <TrendIcon size={14} className={trendColors[dept.trend] || 'text-gray-400'} />
                  <span className="text-3xl font-black" style={{ color: dept.color || '#ef4444' }}>{dept.efficiency}%</span>
                </div>
              </div>

              {/* Efficiency Bar */}
              <div className="mb-4">
                <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${dept.efficiency}%`, background: dept.color || '#ef4444' }} />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Loss Contrib.', value: `${dept.lossContribution}%`, bad: dept.lossContribution > 20 },
                  { label: 'Downtime', value: `${dept.downtime}h`, bad: dept.downtime > 3 },
                  { label: 'Incidents', value: dept.incidents, bad: dept.incidents > 3 },
                ].map((m, j) => (
                  <div key={j} className="text-center p-2 rounded-lg bg-white/3 border border-gray-800">
                    <div className={`text-base font-bold ${m.bad ? 'text-red-400' : 'text-gray-300'}`}>{m.value}</div>
                    <div className="text-xs text-gray-600 mt-0.5 leading-tight">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Issues */}
              {dept.issues && dept.issues.length > 0 ? (
                <div className="space-y-1">
                  {dept.issues.map((issue, j) => (
                    <div key={j} className="flex items-center gap-2 text-xs text-gray-400">
                      <AlertTriangle size={10} className="text-amber-400 flex-shrink-0" />
                      <span className="truncate">{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span>✓</span> No active issues
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison Chart */}
      <div className="chart-container">
        <h2 className="text-base font-bold text-white mb-1">Weekly Department Efficiency Comparison</h2>
        <p className="text-xs text-gray-500 mb-4">All departments — Last 7 days</p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={activeWeekly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[65, 95]} />
            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
            <Line type="monotone" dataKey="rolling" stroke="#f59e0b" strokeWidth={2} dot={false} name="Rolling Mill" />
            <Line type="monotone" dataKey="sms" stroke="#10b981" strokeWidth={2} dot={false} name="Steel Melt Shop" />
            <Line type="monotone" dataKey="bf" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Blast Furnace" />
            <Line type="monotone" dataKey="power" stroke="#a78bfa" strokeWidth={2} dot={false} name="Power Plant" />
            <Line type="monotone" dataKey="maint" stroke="#ef4444" strokeWidth={2} dot={false} name="Maintenance" />
            <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Loss Contribution Table */}
      <div className="card animate-slide-up">
        <h2 className="text-base font-bold text-white mb-4">Department Loss Contribution Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                {['Rank', 'Department', 'Head', 'Efficiency', 'Loss Contribution', 'Downtime', 'Incidents', 'Energy Waste'].map(h => (
                  <th key={h} className="text-xs text-gray-500 uppercase tracking-wider py-3 px-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((dept, i) => (
                <tr key={dept.id} className="border-b border-gray-800/50 hover:bg-white/2">
                  <td className="py-3 px-3">
                    <span className="text-sm font-bold text-gray-400 font-mono">#{i + 1}</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">{dept.name}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{dept.head}</td>
                  <td className="py-3 px-3">
                    <span className={`font-bold ${dept.efficiency >= 88 ? 'text-emerald-400' : dept.efficiency >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                      {dept.efficiency}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`badge ${dept.lossContribution >= 25 ? 'badge-critical' : dept.lossContribution >= 15 ? 'badge-warning' : 'badge-success'}`}>
                      {dept.lossContribution}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-300 font-mono">{dept.downtime}h</td>
                  <td className="py-3 px-3 text-gray-300 font-mono">{dept.incidents}</td>
                  <td className="py-3 px-3 text-gray-300 font-mono">{dept.energyWaste}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
