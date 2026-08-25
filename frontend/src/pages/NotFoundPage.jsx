import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 mb-4 animate-bounce">
        <Sparkles className="w-8 h-8" />
      </div>
      <span className="text-6xl font-black text-slate-900 tracking-tight">404</span>
      <h1 className="text-xl font-bold text-slate-700 mt-2 mb-1">
        Página no encontrada
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6">
        La página o publicación que estás buscando no existe, ha sido movida o eliminada por el autor.
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Volver atrás
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/feed')}
          leftIcon={<Home className="w-4 h-4" />}
          className="font-bold"
        >
          Ir al Inicio
        </Button>
      </div>
    </div>
  );
}
