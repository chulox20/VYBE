import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  Users,
  Compass,
  ShieldCheck,
  Zap,
  Heart,
  Flame,
  Layers,
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../contexts/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';

export function LandingPage() {
  const navigate = useNavigate();
  const { loginDemo, user } = useAuth();

  const handleQuickDemo = async (email) => {
    try {
      await loginDemo(email);
      navigate('/feed');
    } catch (err) {
      console.error('Demo login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              VYBE
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/feed')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-bold"
              >
                Ir a mi Feed
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold text-slate-700 hover:text-purple-600 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  Iniciar sesión
                </Link>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/register')}
                  className="font-bold hidden sm:inline-flex"
                >
                  Crear cuenta
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center gap-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/80 border border-purple-200 text-purple-700 text-xs font-bold shadow-sm">
            <Flame className="w-4 h-4 text-pink-500" />
            <span>La nueva era de la conexión tecnológica</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Tu gente. Tus ideas.{' '}
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-800 bg-clip-text text-transparent">
              Tu VYBE.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
            Una nueva forma de compartir lo que piensas, descubrir personas con tus mismos intereses y crear comunidades tecnológicas vibrantes en tiempo real.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/register')}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="text-base px-8 py-3.5 font-extrabold shadow-xl shadow-purple-500/25"
            >
              Crear cuenta gratis
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/explore')}
              rightIcon={<Compass className="w-5 h-5" />}
              className="text-base px-8 py-3.5 font-bold border-slate-300 hover:border-purple-500"
            >
              Explorar la red
            </Button>
          </div>

          {/* Demo Users One-Click Login */}
          <div className="mt-8 p-4 sm:p-5 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-md max-w-xl w-full">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              ⚡ Acceso rápido de prueba con un clic:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickDemo(acc.email)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-purple-100 text-slate-800 hover:text-purple-700 text-xs font-semibold transition-all border border-slate-200/60"
                >
                  <Avatar src={acc.avatar} name={acc.name} size="xs" />
                  <span>{acc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/20 to-pink-400/20 blur-3xl -z-10 rounded-full pointer-events-none" />
      </section>

      {/* Feature Pillars */}
      <section className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Diseñado para creadores, desarrolladores e innovadores
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2">
              Todo lo que necesitas para una experiencia social sin distracciones publicitarias ni algoritmos opacos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/70 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Comunidades Temáticas</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Crea o únete a espacios dedicados a React, Inteligencia Artificial, UI/UX, Cloud y debate con profesionales afines.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/70 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tiempo Real & WebSockets</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Notificaciones instantáneas, likes dinámicos y mensajería directa con indicadores de escritura en tiempo real.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/70 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Moderación y Privacidad</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Herramientas de reporte comunitario, visibilidad controlada y panel de administración para mantener un entorno seguro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
        <p>© 2026 VYBE Social Network. Construido con React, Node.js, Express, PostgreSQL y Socket.IO.</p>
      </footer>
    </div>
  );
}
