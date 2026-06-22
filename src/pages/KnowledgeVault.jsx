import { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Tag, Filter, X } from 'lucide-react';
import { api } from '../services/api';
import { knowledgeEntries, departments, severities } from '../data/knowledge';

const severityColors = {
  critical: 'badge-critical',
  high: 'badge-warning',
  medium: 'badge-info',
  low: 'badge-success',
};

function KnowledgeCard({ entry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card border border-gray-800 hover:border-gray-700 transition-all cursor-pointer animate-fade-in"
      onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`badge ${severityColors[entry.severity] || 'badge-info'}`}>
              {(entry.severity || 'medium').toUpperCase()}
            </span>
            <span className="badge badge-info text-xs">{entry.department}</span>
          </div>
          <h3 className="text-base font-bold text-white leading-tight">{entry.problem}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-black text-emerald-400">{entry.successRate}%</div>
          <div className="text-xs text-gray-500">success rate</div>
          <div className="text-xs text-gray-600 mt-0.5 font-mono">Used {entry.usageCount}x</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        {[
          { label: '⚠ Cause', value: entry.cause, color: 'border-amber-500/20 bg-amber-500/5', textColor: 'text-amber-300' },
          { label: '✓ Solution', value: entry.solution, color: 'border-emerald-500/20 bg-emerald-500/5', textColor: 'text-emerald-300' },
          { label: '🔧 Machine', value: entry.machine, color: 'border-sky-500/20 bg-sky-500/5', textColor: 'text-sky-300' },
        ].map((item, i) => (
          <div key={i} className={`p-3 rounded-xl border ${item.color} ${!expanded && i === 1 ? 'md:col-span-2' : ''}`}>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{item.label}</div>
            <p className={`text-xs ${item.textColor} leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {expanded && (
        <div className="animate-slide-down">
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {entry.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-gray-700 text-xs text-gray-400">
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Added by: <span className="text-gray-300">{entry.addedBy || 'System User'}</span></span>
            <span>Date: <span className="text-gray-300">{entry.date}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeVault() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ problem: '', cause: '', solution: '', machine: '', department: 'Rolling Mill', severity: 'medium' });
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgSuccessRate: 0, totalUsages: 0 });
  const [loading, setLoading] = useState(true);

  async function fetchKnowledge() {
    try {
      const data = await api.knowledge.getAll(search, deptFilter, severityFilter);
      const statistics = await api.knowledge.getStats();
      setEntries(data);
      setStats(statistics);
    } catch (err) {
      console.error('Failed to fetch knowledge entries:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKnowledge();
  }, [search, deptFilter, severityFilter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newEntry,
        added_by: JSON.parse(localStorage.getItem('ispat_user') || '{}').name || 'Current User',
      };
      await api.knowledge.create(payload);
      setNewEntry({ problem: '', cause: '', solution: '', machine: '', department: 'Rolling Mill', severity: 'medium' });
      setShowForm(false);
      fetchKnowledge();
    } catch (err) {
      console.error('Failed to save knowledge entry:', err);
    }
  };

  const activeEntries = entries.length > 0 ? entries : knowledgeEntries.filter(e => {
    const matchSearch = !search ||
      e.problem.toLowerCase().includes(search.toLowerCase()) ||
      e.cause.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'All Departments' || e.department === deptFilter;
    const matchSev = severityFilter === 'All' || e.severity === severityFilter;
    return matchSearch && matchDept && matchSev;
  });

  const activeStats = entries.length > 0 ? stats : {
    total: activeEntries.length,
    avgSuccessRate: Math.round(activeEntries.reduce((a, e) => a + e.successRate, 0) / (activeEntries.length || 1)),
    totalUsages: activeEntries.reduce((a, e) => a + e.usageCount, 0),
  };

  return (
    <div className="page-container space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Entries', value: activeStats.total, color: 'text-sky-400' },
          { label: 'Avg Success Rate', value: `${activeStats.avgSuccessRate}%`, color: 'text-emerald-400' },
          { label: 'Total Usages', value: activeStats.totalUsages, color: 'text-purple-400' },
        ].map((s, i) => (
          <div key={i} className="card border border-gray-800 text-center">
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[260px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search problems, causes, solutions..."
            className="input-dark w-full pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Department filter */}
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="input-dark">
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Severity filter */}
        <div className="flex gap-2">
          {severities.map(s => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                severityFilter === s ? 'bg-primary-500 text-white' : 'bg-white/5 text-gray-400 border border-gray-800 hover:text-white'
              }`}>
              {s}
            </button>
          ))}
        </div>

        <button onClick={() => setShowForm(!showForm)} className="btn-primary ml-auto">
          <Plus size={14} />
          Add Entry
        </button>
      </div>

      {/* Add New Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card border border-primary-500/20 bg-primary-500/5 animate-slide-up space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-bold text-white">Add Knowledge Entry</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Problem Description *</label>
              <input value={newEntry.problem} onChange={e => setNewEntry({...newEntry, problem: e.target.value})}
                className="input-dark w-full" placeholder="Describe the problem..." required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Root Cause *</label>
              <input value={newEntry.cause} onChange={e => setNewEntry({...newEntry, cause: e.target.value})}
                className="input-dark w-full" placeholder="What causes this problem?" required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Machine/Equipment *</label>
              <input value={newEntry.machine} onChange={e => setNewEntry({...newEntry, machine: e.target.value})}
                className="input-dark w-full" placeholder="Machine name" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Solution / Procedure *</label>
              <textarea value={newEntry.solution} onChange={e => setNewEntry({...newEntry, solution: e.target.value})}
                className="input-dark w-full h-20 resize-none" placeholder="Step-by-step solution..." required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Department</label>
              <select value={newEntry.department} onChange={e => setNewEntry({...newEntry, department: e.target.value})}
                className="input-dark w-full">
                {departments.filter(d => d !== 'All Departments').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-semibold uppercase tracking-wider">Severity</label>
              <select value={newEntry.severity} onChange={e => setNewEntry({...newEntry, severity: e.target.value})}
                className="input-dark w-full">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save Entry</button>
          </div>
        </form>
      )}

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{activeEntries.length} entries found</p>
      </div>

      <div className="space-y-4">
        {activeEntries.length === 0 ? (
          <div className="card border border-gray-800 text-center py-12">
            <BookOpen size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No entries found</p>
            <p className="text-xs text-gray-600 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          activeEntries.map(entry => <KnowledgeCard key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
