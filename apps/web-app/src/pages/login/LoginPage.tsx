import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { ApiClientError } from '../../api/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function LoginPage() {
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuth();

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await login(email, password);
    } catch (err) {
      setStatus('error');
      const errText = err instanceof ApiClientError ? err.message : 'Error al conectar con el servidor';
      setMessage(errText);
      toast.error(errText);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Esta funcionalidad estará disponible próximamente. Por favor, contacte al administrador.');
  };

  const isDisabled = status === 'loading';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] font-sans">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--surface-solid)] border border-[var(--border)] shadow-2xl backdrop-blur-xl animate-fade-in space-y-6">
        {/* Brand */}
        <div className="text-center">
          <h1 className="font-heading font-extrabold text-3xl text-[var(--text-h)] tracking-tight">
            Vet<span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Vault</span>
          </h1>
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[var(--text-h)]">
            Bienvenido de nuevo
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Ingresá a tu portal de gestión veterinaria
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isDisabled}
          />

          <div className="space-y-1.5">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold text-[var(--text-h)] tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-h)] placeholder-[var(--text-muted)] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] disabled:opacity-60"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isDisabled}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-h)] cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
                onClick={handleForgotPassword}
                disabled={isDisabled}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth disabled={isDisabled}>
            {status === 'loading' ? 'Procesando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {status === 'success' && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-500 text-center animate-fade-in">
            {message}
          </div>
        )}

        <div className="text-center text-xs text-[var(--text-muted)] pt-2">
          <span>¿No tenés cuenta? </span>
          <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
            Registrate
          </Link>
        </div>
      </div>
    </div>
  );
}
