import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Eye, EyeOff, AlertCircle, ChevronDown } from 'lucide-react';
import { api } from '../services/api';

const roles = [
  { value: 'Plant Manager', label: 'Plant Manager', desc: 'Executive Dashboard & Full Access' },
  { value: 'Production Manager', label: 'Production Manager', desc: 'Production & Shift Analytics' },
  { value: 'Maintenance Engineer', label: 'Maintenance Engineer', desc: 'Equipment Health & Predictive Maint.' },
  { value: 'Department Head', label: 'Department Head', desc: 'Department Performance & Reports' },
  { value: 'Operator', label: 'Operator', desc: 'Knowledge Vault & AI Assistant' },
];

const credentials = {
  'manager@ispat.ai': { name: 'Anil Desai', role: 'Plant Manager', password: 'admin123' },
  'rajesh@ispat.ai': { name: 'Rajesh Kumar', role: 'Maintenance Engineer', password: 'maint123' },
  'amit@ispat.ai': { name: 'Amit Sharma', role: 'Production Manager', password: 'prod123' },
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@ispat.ai');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState('Plant Manager');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoles, setShowRoles] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Call Backend API to authenticate / retrieve profile
      const user = await api.auth.login(email, '', role);
      localStorage.setItem('ispat_user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      console.error('Authentication error:', err);
      // Fallback for offline/demo if API is down
      const cred = credentials[email];
      if (cred && cred.password === password) {
        localStorage.setItem('ispat_user', JSON.stringify({ name: cred.name, email, role }));
        navigate('/dashboard');
      } else {
        setError('Connection to backend failed and invalid demo credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0b0f1a' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent)', animationDelay: '1.5s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 rounded-full opacity-6 blur-3xl animate-pulse-slow"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)', animationDelay: '3s' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass rounded-2xl p-8 shadow-2xl" style={{ boxShadow: '0 0 60px rgba(14,165,233,0.1)' }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #818cf8)' }}>
              <Flame size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-1">ISPAT <span className="text-gradient">AI</span></h1>
            <p className="text-gray-400 text-sm">Operational Intelligence Platform</p>
            <p className="text-gray-600 text-xs mt-1 italic">"Detecting hidden losses before they become visible losses"</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-dark w-full"
                placeholder="your@ispat.ai"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-dark w-full pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Login As
              </label>
              <div className="relative">
                <button type="button"
                  onClick={() => setShowRoles(!showRoles)}
                  className="input-dark w-full text-left flex items-center justify-between">
                  <span className="text-gray-100">{role}</span>
                  <ChevronDown size={14} className={`text-gray-500 transition-transform ${showRoles ? 'rotate-180' : ''}`} />
                </button>
                {showRoles && (
                  <div className="absolute top-full left-0 right-0 mt-1 card border-gray-700 z-20 shadow-xl">
                    {roles.map(r => (
                      <button key={r.value} type="button"
                        onClick={() => { setRole(r.value); setShowRoles(false); }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all hover:bg-white/5 ${role === r.value ? 'bg-primary-500/10' : ''}`}>
                        <div className="text-sm font-medium text-white">{r.label}</div>
                        <div className="text-xs text-gray-500">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Demo credentials hint */}
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-gray-400">
              <span className="text-blue-400 font-semibold">Demo:</span> manager@ispat.ai / admin123
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: loading ? '#374151' : 'linear-gradient(135deg, #0ea5e9, #818cf8)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : 'Access Platform →'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-600 mt-6">
            ISPAT AI v2.4 • Steel Manufacturing Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
}
