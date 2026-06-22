import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, TrendingDown, CheckCircle2, Brain } from 'lucide-react';
import { api } from '../services/api';
import { rootCauseAnalysis } from '../data/production';

function ConfidenceBar({ value, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-bold font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

function RCACard({ rca }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="card border border-gray-800 hover:border-gray-700 transition-all animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Brain size={18} className="text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-bold text-white">Incident #{rca.id}</span>
              <span className="badge badge-critical">{rca.lossPercent}% Production Drop</span>
            </div>
            <p className="text-xs text-gray-500">Date: {rca.date}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-red-400">{rca.productionLost}T</div>
          <div className="text-xs text-gray-500">production lost</div>
        </div>
      </div>

      {/* AI Confidence */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">AI Analysis Confidence</span>
        </div>
        <ConfidenceBar value={rca.confidence} color="#818cf8" />
      </div>

      {/* Cause Chain */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Primary Cause', value: rca.primaryCause, dept: rca.primaryCauseDept, color: 'border-red-500/30 bg-red-500/5', textColor: 'text-red-400', pct: '55%' },
          { label: 'Secondary Cause', value: rca.secondaryCause, dept: rca.secondaryCauseDept, color: 'border-amber-500/30 bg-amber-500/5', textColor: 'text-amber-400', pct: '30%' },
          { label: 'Tertiary Cause', value: rca.tertiaryCause, dept: 'Contributing', color: 'border-purple-500/30 bg-purple-500/5', textColor: 'text-purple-400', pct: '15%' },
        ].map((cause, i) => (
          <div key={i} className={`p-3 rounded-xl border ${cause.color}`}>
            <div className="text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">{cause.label}</div>
            <div className={`text-sm font-bold ${cause.textColor} mb-1 leading-tight`}>{cause.value}</div>
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
              <span className="text-xs text-gray-500">{cause.dept}</span>
              <span className={`text-xs font-bold ${cause.textColor}`}>{cause.pct} impact</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={14} className="text-indigo-400" />
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">AI Analysis Summary</span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{rca.aiSummary}</p>
      </div>

      {/* Timeline toggle */}
      <button onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-all mb-3">
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide' : 'Show'} Incident Timeline
      </button>

      {/* Timeline */}
      {expanded && rca.timeline && rca.timeline.length > 0 && (
        <div className="space-y-3 animate-slide-down">
          {rca.timeline.map((event, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-red-500/20 border-red-500/40 text-red-400' :
                  i === rca.timeline.length - 1 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
                  'bg-gray-800 border-gray-700 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                {i < rca.timeline.length - 1 && (
                  <div className="w-px h-6 bg-gray-800 mt-1" />
                )}
              </div>
              <div className="pb-2 flex-1 min-w-0">
                <span className="text-xs font-mono text-primary-400 font-bold">{event.time}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{event.event}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RootCause() {
  const [rcaList, setRcaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchData() {
      try {
        const res = await api.production.getRCA();
        if (active) {
          setRcaList(res);
        }
      } catch (err) {
        console.error('Failed to fetch Root Cause Analysis data:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, []);

  const activeRCA = rcaList.length > 0 ? rcaList : rootCauseAnalysis;

  if (loading && rcaList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-3 mt-4 text-gray-400 text-sm">Running Root Cause Classifier models...</span>
      </div>
    );
  }

  const avgConfidence = activeRCA.length > 0
    ? Math.round(activeRCA.reduce((a, r) => a + r.confidence, 0) / activeRCA.length)
    : 85;

  const totalLoss = activeRCA.reduce((a, r) => a + r.productionLost, 0);

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Incidents Analyzed', value: activeRCA.length, color: 'text-sky-400', icon: Brain },
          { label: 'Avg Confidence', value: `${avgConfidence}%`, color: 'text-purple-400', icon: CheckCircle2 },
          { label: 'Total Loss Analyzed', value: `${totalLoss}T`, color: 'text-red-400', icon: TrendingDown },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card border border-gray-800 text-center">
              <Icon size={20} className={`${s.color} mx-auto mb-2`} />
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <Brain size={20} className="text-indigo-400 flex-shrink-0 animate-pulse" />
        <div>
          <p className="text-sm font-semibold text-white">AI Root Cause Analysis Engine</p>
          <p className="text-xs text-gray-400">Uses Random Forest + XGBoost to classify production loss causes. Confidence scores indicate model certainty based on sensor data anomaly correlation and historical shift logs.</p>
        </div>
      </div>

      {/* RCA Cards */}
      <div className="space-y-5">
        {activeRCA.map((rca) => (
          <RCACard key={rca.id} rca={rca} />
        ))}
      </div>
    </div>
  );
}
