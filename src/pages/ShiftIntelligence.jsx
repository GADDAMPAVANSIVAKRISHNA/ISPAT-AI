import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { shiftData, shiftWeeklyTrend, shiftIncidents } from '../data/shifts';

const severityColors = {
  critical: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', badge: 'badge-critical' },
  high: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', badge: 'badge-critical' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'badge-warning' },
  low: { bg: 'bg-gray-800', border: 'border-gray-700', text: 'text-gray-400', badge: 'badge-info' },
};

export default function ShiftIntelligence() {
  const [shifts, setShifts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [shiftsRes, incidentsRes, weeklyRes] = await Promise.all([
          api.shifts.getAll(),
          api.shifts.getIncidents(),
          api.shifts.getWeekly()
        ]);
        if (active) {
          setShifts(shiftsRes);
          setIncidents(incidentsRes);
          setWeekly(weeklyRes);
        }
      } catch (err) {
        console.error('Failed to fetch shift intelligence:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchData();

    // Poll every 10 seconds for shift performance updates
    const interval = setInterval(fetchData, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const activeShifts = shifts.length > 0 ? shifts : shiftData;
  const activeIncidents = incidents.length > 0 ? incidents : shiftIncidents;
  const activeWeekly = weekly.length > 0 ? weekly : shiftWeeklyTrend;

  // Build metrics for radar chart
  const morningShift = activeShifts.find(s => s.name.includes('Morning')) || { efficiency: 92, output: 348, target: 333, downtime: 0.8, incidents: 1 };
  const eveningShift = activeShifts.find(s => s.name.includes('Evening')) || { efficiency: 83, output: 302, target: 333, downtime: 2.1, incidents: 2 };
  const nightShift = activeShifts.find(s => s.name.includes('Night')) || { efficiency: 74, output: 267, target: 333, downtime: 4.2, incidents: 3 };

  const radarData = [
    { metric: 'Efficiency', morning: morningShift.efficiency, evening: eveningShift.efficiency, night: nightShift.efficiency },
    { metric: 'Safety', morning: 95 - morningShift.incidents * 5, evening: 90 - eveningShift.incidents * 5, night: 80 - nightShift.incidents * 5 },
    { metric: 'Output Rate', morning: Math.round((morningShift.output / (morningShift.target || 1)) * 100), evening: Math.round((eveningShift.output / (eveningShift.target || 1)) * 100), night: Math.round((nightShift.output / (nightShift.target || 1)) * 100) },
    { metric: 'Timeliness', morning: 98, evening: 82, night: 65 },
    { metric: 'Downtime Rev.', morning: Math.max(50, 100 - morningShift.downtime * 10), evening: Math.max(50, 100 - eveningShift.downtime * 10), night: Math.max(50, 100 - nightShift.downtime * 10) },
  ];

  if (loading && shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 mt-4 text-gray-400 text-sm">Loading shift intelligence dashboards...</span>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Shift Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {activeShifts.map((shift) => (
          <div key={shift.id} className="card border border-gray-800 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white leading-tight">{shift.name}</h3>
                <p className="text-xs text-gray-500 mt-1 font-mono">{shift.time}</p>
                <p className="text-xs text-gray-600 mt-0.5">Supervisor: {shift.supervisor}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-3xl font-black" style={{ color: shift.color || '#ef4444' }}>{shift.efficiency}%</div>
                <div className="text-xs text-gray-500">efficiency</div>
              </div>
            </div>

            {/* Efficiency bar */}
            <div className="mb-4">
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${shift.efficiency}%`, background: shift.color || '#ef4444' }} />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Output', value: `${shift.output}T`, icon: TrendingUp, color: 'text-sky-400' },
                { label: 'Target', value: `${shift.target}T`, icon: TrendingUp, color: 'text-gray-400' },
                { label: 'Downtime', value: `${shift.downtime}h`, icon: Clock, color: shift.downtime > 2 ? 'text-red-400' : 'text-amber-400' },
                { label: 'Incidents', value: shift.incidents, icon: AlertTriangle, color: shift.incidents > 2 ? 'text-red-400' : 'text-amber-400' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="p-2 rounded-lg bg-white/3 border border-gray-800">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon size={11} className={stat.color} />
                      <span className="text-xs text-gray-500">{stat.label}</span>
                    </div>
                    <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3">
              <span className={`badge text-xs ${
                shift.status === 'excellent' ? 'badge-success' :
                shift.status === 'good' ? 'badge-warning' : 'badge-critical'
              }`}>{shift.status ? shift.status.toUpperCase() : 'POOR'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="chart-container">
          <h2 className="text-base font-bold text-white mb-1">Weekly Efficiency Trend</h2>
          <p className="text-xs text-gray-500 mb-4">All shifts — Last 7 days</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activeWeekly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="morning" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} name="Morning" />
              <Line type="monotone" dataKey="evening" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} name="Evening" />
              <Line type="monotone" dataKey="night" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} name="Night" />
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="chart-container">
          <h2 className="text-base font-bold text-white mb-1">Shift Performance Radar</h2>
          <p className="text-xs text-gray-500 mb-4">Multi-metric comparison</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Radar name="Morning" dataKey="morning" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Evening" dataKey="evening" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
              <Radar name="Night" dataKey="night" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-400">{v}</span>} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Incident Log */}
      <div className="card animate-slide-up">
        <h2 className="text-base font-bold text-white mb-4">Today's Incident Log</h2>
        <div className="space-y-2">
          {activeIncidents.map((inc, i) => {
            const colors = severityColors[inc.severity] || severityColors.low;
            return (
              <div key={i} className={`flex items-start gap-4 p-3 rounded-xl border ${colors.border} ${colors.bg} transition-all`}>
                <div className="text-xs font-mono text-primary-400 font-bold w-12 flex-shrink-0 pt-0.5">{inc.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-white leading-tight">{inc.description}</span>
                    <span className={`badge text-xs ${colors.badge}`}>{inc.severity.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{inc.shift} Shift</span>
                    <span>•</span>
                    <span>{inc.type}</span>
                    <span>•</span>
                    <span className={inc.resolved ? 'text-emerald-400' : 'text-red-400 font-semibold'}>
                      {inc.resolved ? '✓ Resolved' : '⚡ Active'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
