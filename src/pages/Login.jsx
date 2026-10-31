import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      const home = user.role === 'owner' ? '/dashboard' : '/sales';
      navigate(location.state?.from?.pathname || home, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-shell flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 mb-5">
            <Flame className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">LPG Operations</h1>
          <p className="text-steel-light mt-2">Gas distribution management system</p>
        </div>

        <form onSubmit={submit} className="bg-shell-light rounded-2xl p-8 border border-white/5 space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-light" />
            <input
              type="email" required autoComplete="username" placeholder="Email"
              value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-steel-light text-sm focus:outline-none focus:border-accent/60"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel-light" />
            <input
              type="password" required autoComplete="current-password" placeholder="Password"
              value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-steel-light text-sm focus:outline-none focus:border-accent/60"
            />
          </div>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <button
            type="submit" disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-shell font-semibold text-sm disabled:opacity-60 cursor-pointer"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
