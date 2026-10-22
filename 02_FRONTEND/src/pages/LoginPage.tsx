import React, { useState } from 'react';
import { Monitor, Cloud, Lock, User, ArrowRight, Server, Database, HardDrive, Sun, Moon } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { ThemeMode } from '../utils/theme';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ username, password });
      setAuthToken(res.access_token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación. Verifica usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 dark:bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Single Theme Toggle Button on top right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-amber-300 shadow-md transition-all text-xs font-semibold cursor-pointer"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span>Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 relative z-10 border border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-sky-500/25 mb-4">
            <Monitor className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">ERP TechStore</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Venta de Cómputo • Pantallas, Celulares, Tablets & CPUs</p>
        </div>

        {/* AWS Architecture Pill */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-2xl mb-6 text-center text-[11px] text-slate-600 dark:text-slate-300">
          <div className="flex flex-col items-center gap-0.5">
            <Server className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">EC2</span>
            <span className="text-[10px] text-slate-400">FastAPI</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 border-x border-slate-200 dark:border-slate-700">
            <HardDrive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">S3</span>
            <span className="text-[10px] text-slate-400">Archivos</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">RDS</span>
            <span className="text-[10px] text-slate-400">PostgreSQL</span>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Usuario o Correo
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: admin"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block animate-spin mr-2">⭮</span>
            ) : (
              <>
                <span>Acceder a la Plataforma</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-400">Credenciales por defecto del sistema:</p>
          <div className="mt-1.5 inline-block bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300">
            Usuario: <b>admin</b> | Clave: <b>admin123</b>
          </div>
        </div>
      </div>
    </div>
  );
};
