import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, User, Mail, Lock, AtSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        full_name: fullName.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
      });
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Error al crear la cuenta.');
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
            Únete a VYBE
          </h1>
          <p className="text-xs text-slate-500">
            Crea tu perfil único y comparte tus ideas hoy mismo
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Input
            label="Nombre Completo *"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Jesús Pérez"
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Nombre de Usuario (@username) *"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ej: chulox, maya.design"
            leftIcon={<AtSign className="w-4 h-4" />}
          />

          <Input
            label="Correo Electrónico *"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contraseña *"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="Confirmar *"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full font-bold shadow-md shadow-purple-500/20 py-3 mt-2"
          >
            Crear mi cuenta
          </Button>
        </form>

        {/* Footer link to Login */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          ¿Ya tienes una cuenta en VYBE?{' '}
          <Link to="/login" className="text-purple-600 font-bold hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
