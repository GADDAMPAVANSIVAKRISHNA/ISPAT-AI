import { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line
} from 'recharts';
import { Activity, Thermometer, Zap, Wind, Gauge, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';
import { machines, rul7Days } from '../data/machines';

const statusColors = {
  critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'badge-critical', dot: 'bg-red-400' },
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'badge-warning', dot: 'bg-amber-400' },
  healthy: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'badge-success', dot: 'bg-emerald-400' },
};

const sensorIcons = {
  temperature: Thermometer,
  vibration: Activity,
  current: Zap,
  pressure: Gauge,
  rpm: Wind,
  runtimeHours: Clock,
};

function SensorBar({ name, sensor }) {
  const pct = Math.min(100, (sensor.value / sensor.threshold) * 100);
  const Icon = sensorIcons[name] || Activity;
  const barColor = sensor.status === 'critical' ? '#ef4444' : sensor.status === 'warning' ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <Icon size={14} className={sensor.status === 'critical' ? 'text-red-400' : sensor.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400 capitalize">{name.replace(/([A-Z])/g, ' $1')}</span>
          <span className="text-white font-mono font-semibold">{sensor.value} {sensor.unit}</span>
        </div>
        <div className="risk-bar">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <div className="text-xs text-gray-600 mt-0.5">Threshold: {sensor.threshold} {sensor.unit}</div>
      </div>
    </div>
  );
}

function MachineCard({ machine }) {
  const [expanded, setExpanded] = useState(false);
  const colors = statusColors[machine.status] || statusColors.healthy;
  const rulData = (machine.history || []).map((v, i) => ({ day: `D-${6 - i}`, risk: v }));

  return (
    <div className={`card border ${colors.border} ${colors.bg} transition-all duration-300`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl border ${colors.border} flex items-center justify-center flex-shrink-0`}>
            <Activity size={18} className={colors.text} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">{machine.name}</h3>
              <span className={colors.badge}>{machine.status}</span>
              {machine.anomaly?.is_anomaly && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase tracking-wider animate-pulse">
                  Anomaly ({machine.anomaly.anomaly_score})
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{machine.type} • {machine.department} • {machine.location}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black ${colors.text}`}>{machine.failureProbability}%</div>
          <div className="text-xs text-gray-500">failure risk</div>
          <div className="text-xs text-gray-400 mt-0.5 font-mono">
            RUL: <span className="font-bold text-white">{machine.rulDays}d</span>
          </div>
        </div>
      </div>

      {/* Failure probability bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Failure Probability</span>
          <span className={colors.text}>{machine.failureProbability}%</span>
        </div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${machine.failureProbability}%`,
              background: machine.status === 'critical' ? 'linear-gradient(90deg, #f59e0b, #ef4444)' :
                         machine.status === 'warning' ? 'linear-gradient(90deg, #10b981, #f59e0b)' :
                         'linear-gradient(90deg, #0ea5e9, #10b981)'
            }} />
        </div>
      </div>

      {/* Alerts */}
      {machine.alerts && machine.alerts.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {machine.alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <AlertTriangle size={11} className={colors.text} />
              <span className="text-gray-400">{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      <div className={`flex items-center justify-between p-3 rounded-lg border ${colors.border} mb-3 bg-black/20`}>
        <div>
          <p className="text-xs text-gray-500">Recommended Action</p>
          <p className="text-sm font-semibold text-white leading-tight mt-0.5">{machine.recommendedAction}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500">Est. Downtime</p>
          <p className="text-sm font-semibold text-white mt-0.5">{machine.estimatedDowntime}</p>
        </div>
      </div>

      {/* Expand toggle */}
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-all py-1">
        {expanded ? <><ChevronUp size={12} /> Hide Sensor Details</> : <><ChevronDown size={12} /> Show Sensor Details</>}
      </button>

      {/* Sensor Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          {machine.sensors ? (
            Object.entries(machine.sensors).map(([name, sensor]) => (
              <SensorBar key={name} name={name} sensor={sensor} />
            ))
          ) : (
            <div className="text-xs text-gray-600 italic">No sensor telemetry available.</div>
          )}

          {/* Mini trend chart */}
          {rulData.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 mb-2">7-Day Risk Trend (ML inference history)</p>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={rulData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <Line type="monotone" dataKey="risk" stroke={machine.status === 'critical' ? '#ef4444' : machine.status === 'warning' ? '#f59e0b' : '#10b981'}
                    strokeWidth={2} dot={false} />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={false} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PredictiveMaintenance() {
  const [filter, setFilter] = useState('all');
  const [machinesList, setMachinesList] = useState([]);
  const [rulOverview, setRulOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const [machinesRes, rulRes] = await Promise.all([
          api.machines.getAll(),
          api.machines.getRulOverview()
        ]);
        if (active) {
          setMachinesList(machinesRes);
          setRulOverview(rulRes);
        }
      } catch (err) {
        console.error('Failed to fetch predictive maintenance telemetry:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchData();

    // Poll every 10 seconds for real-time sensor ticks
    const interval = setInterval(fetchData, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const activeMachines = machinesList.length > 0 ? machinesList : machines;
  const activeRul = rulOverview.length > 0 ? rulOverview : rul7Days;

  const filtered = filter === 'all' ? activeMachines : activeMachines.filter(m => m.status === filter);

  const summary = {
    critical: activeMachines.filter(m => m.status === 'critical').length,
    warning: activeMachines.filter(m => m.status === 'warning').length,
    healthy: activeMachines.filter(m => m.status === 'healthy').length,
  };

  if (loading && machinesList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 mt-4 text-gray-400 text-sm">Analyzing machine sensors...</span>
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Critical', value: summary.critical, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
          { label: 'Warning', value: summary.warning, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { label: 'Healthy', value: summary.healthy, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        ].map((s, i) => (
          <div key={i} className={`card border ${s.border} ${s.bg} text-center`}>
            <div className={`text-4xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* RUL Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Remaining Useful Life (RUL) — All Machines</h2>
            <p className="text-xs text-gray-500">Random Forest + XGBoost Prognostics Model</p>
          </div>
        </div>
        <div className="space-y-3">
          {activeRul.map((m) => (
            <div key={m.name} className="flex items-center gap-4">
              <span className="text-xs text-gray-400 w-40 truncate flex-shrink-0">{m.name}</span>
              <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (m.days / 90) * 100)}%`,
                    background: m.risk >= 70 ? '#ef4444' : m.risk >= 40 ? '#f59e0b' : '#10b981',
                  }} />
              </div>
              <span className="text-xs font-mono text-white w-16 text-right flex-shrink-0">{m.days} days</span>
              <span className={`text-xs font-bold w-12 text-right flex-shrink-0 ${m.risk >= 70 ? 'text-red-400' : m.risk >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {m.risk}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'critical', 'warning', 'healthy'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              filter === f ? 'bg-primary-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-gray-800'
            }`}>
            {f === 'all' ? `All Machines (${activeMachines.length})` : `${f} (${summary[f] || 0})`}
          </button>
        ))}
      </div>

      {/* Machine Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {filtered.map((machine) => (
          <MachineCard key={machine.id} machine={machine} />
        ))}
      </div>
    </div>
  );
}
