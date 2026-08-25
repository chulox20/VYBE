import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../contexts/AuthContext.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoEmail) => {
    setLoading(true);
    setError('');
    try {
      await loginDemo(demoEmail);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Error en inicio de sesión demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-500/5 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 mb-1 hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Iniciar sesión en VYBE
          </h1>
          <p className="text-xs text-slate-500">
            Conéctate con tu comunidad de tecnología favorita
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Correo Electrónico"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Contraseña"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span>Recordarme</span>
            </label>
            <a href="#" className="text-purple-600 hover:underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full font-bold shadow-md shadow-purple-500/20 py-3 mt-1"
          >
            Entrar a VYBE
          </Button>
        </form>

        {/* Demo Fast Login */}
        <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            O entra con una cuenta demo de 1 clic:
          </span>
          <div className="flex flex-col gap-1.5 mt-1">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleDemoClick(acc.email)}
                disabled={loading}
                className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 hover:bg-purple-50 text-slate-800 hover:text-purple-700 text-xs font-semibold transition-all border border-slate-200/60"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar src={acc.avatar} name={acc.name} size="xs" />
                  <span className="truncate">{acc.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  @{acc.username}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer link to Register */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-purple-600 font-bold hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
