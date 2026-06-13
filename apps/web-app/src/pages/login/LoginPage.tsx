import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ApiClientError } from '../../api/client';
import { Input } from '../../components/ui/Input';
import './LoginPage.css';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      // login will update auth context → redirect happens via Navigate above
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setMessage(err.message);
      } else {
        setMessage('Error al conectar con el servidor');
      }
    }
  };

  const handleForgotPassword = () => {
    alert('Esta funcionalidad estará disponible próximamente. Por favor, contacte al administrador.');
  };

  const isDisabled = status === 'loading';

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Stethoscope size={28} />
          </div>
          <h1 className="login-brand-title">
            Vet<span>Vault</span>
          </h1>
        </div>

        <div className="login-header">
          <h2>Bienvenido de nuevo</h2>
          <p>Ingresá a tu portal de gestión veterinaria</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isDisabled}
          />

          <div className="password-container">
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isDisabled}
              minLength={6}
            />
            <div className="forgot-password-wrapper">
              <button
                type="button"
                className="forgot-password-btn"
                onClick={handleForgotPassword}
                disabled={isDisabled}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={isDisabled}
          >
            {status === 'loading' ? 'Procesando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {status === 'error' && (
          <div className="login-message error">{message}</div>
        )}
        {status === 'success' && (
          <div className="login-message success">{message}</div>
        )}

        <div className="login-footer">
          <span>¿No tenés cuenta? </span>
          <Link to="/register" className="register-link">
            Registrate
          </Link>
        </div>
      </div>
    </div>
  );
}

