import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Stethoscope, PawPrint } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api, ApiClientError } from '../../api/client';
import { Input } from '../../components/ui/Input';
import './LoginPage.css';

type Mode = 'login' | 'register';
type Role = 'Veterinario' | 'Propietario';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('Propietario');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [numeroMatricula, setNumeroMatricula] = useState('');
  // Clinica fields (vet registration)
  const [clinicaNombre, setClinicaNombre] = useState('');
  const [clinicaDireccion, setClinicaDireccion] = useState('');
  const [clinicaTelefono, setClinicaTelefono] = useState('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNombre('');
    setApellido('');
    setTelefono('');
    setDireccion('');
    setNumeroMatricula('');
    setClinicaNombre('');
    setClinicaDireccion('');
    setClinicaTelefono('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      if (mode === 'login') {
        await login(email, password);
        // login will update auth context → redirect happens via Navigate above
        return;
      }

      // Registration
      if (role === 'Veterinario') {
        await api.post('/auth/register/veterinario', {
          usuario: { email, password },
          veterinario: {
            nombre,
            apellido,
            numero_matricula: numeroMatricula,
            telefono,
          },
          clinica: {
            nombre_comercial: clinicaNombre,
            direccion: clinicaDireccion,
            telefono: clinicaTelefono,
          },
        });
      } else {
        await api.post('/auth/register/propietario', {
          usuario: { email, password },
          propietario: {
            nombre,
            apellido,
            esEmpresa: false,
            telefono,
            direccion,
          },
        });
      }

      setStatus('success');
      setMessage('¡Cuenta creada con éxito! Iniciá sesión para continuar.');
      resetForm();
      setTimeout(() => {
        setMode('login');
        setStatus('idle');
        setMessage('');
      }, 2500);
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiClientError) {
        setMessage(err.message);
      } else {
        setMessage('Error al conectar con el servidor');
      }
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setStatus('idle');
    setMessage('');
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

        <div className="login-mode-toggle">
          <button
            type="button"
            className={`login-mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={`login-mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Registrarse
          </button>
        </div>

        <div className="login-header">
          <h2>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}</h2>
          <p>
            {mode === 'login'
              ? 'Ingresá a tu portal de gestión veterinaria'
              : 'Completá tus datos para registrarte'}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <div className="login-role-toggle">
                <button
                  type="button"
                  className={`login-role-btn ${role === 'Propietario' ? 'active green' : ''}`}
                  onClick={() => setRole('Propietario')}
                >
                  <PawPrint size={16} />
                  Propietario
                </button>
                <button
                  type="button"
                  className={`login-role-btn ${role === 'Veterinario' ? 'active' : ''}`}
                  onClick={() => setRole('Veterinario')}
                >
                  <Stethoscope size={16} />
                  Veterinario
                </button>
              </div>

              <div className="form-row">
                <Input
                  label="Nombre"
                  type="text"
                  placeholder="Juan"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={isDisabled}
                />
                <Input
                  label="Apellido"
                  type="text"
                  placeholder="Pérez"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                  disabled={isDisabled}
                />
              </div>

              <Input
                label="Teléfono"
                type="tel"
                placeholder="351 123 4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
                disabled={isDisabled}
              />

              {role === 'Veterinario' && (
                <>
                  <Input
                    label="Número de Matrícula"
                    type="text"
                    placeholder="MP-12345"
                    value={numeroMatricula}
                    onChange={(e) => setNumeroMatricula(e.target.value)}
                    required
                    disabled={isDisabled}
                  />
                  <div className="login-divider">Datos de la Clínica</div>
                  <Input
                    label="Nombre de la Clínica"
                    type="text"
                    placeholder="Clínica Veterinaria..."
                    value={clinicaNombre}
                    onChange={(e) => setClinicaNombre(e.target.value)}
                    required
                    disabled={isDisabled}
                  />
                  <div className="form-row">
                    <Input
                      label="Dirección"
                      type="text"
                      placeholder="Av. Colón 1234"
                      value={clinicaDireccion}
                      onChange={(e) => setClinicaDireccion(e.target.value)}
                      required
                      disabled={isDisabled}
                    />
                    <Input
                      label="Teléfono Clínica"
                      type="tel"
                      placeholder="351 987 6543"
                      value={clinicaTelefono}
                      onChange={(e) => setClinicaTelefono(e.target.value)}
                      required
                      disabled={isDisabled}
                    />
                  </div>
                </>
              )}

              {role === 'Propietario' && (
                <Input
                  label="Dirección"
                  type="text"
                  placeholder="Tu dirección"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  disabled={isDisabled}
                />
              )}

              <div className="login-divider">Credenciales</div>
            </>
          )}

          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isDisabled}
          />

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

          <button
            type="submit"
            className="login-submit"
            disabled={isDisabled}
          >
            {status === 'loading'
              ? 'Procesando...'
              : mode === 'login'
                ? 'Iniciar Sesión'
                : 'Crear Cuenta'}
          </button>
        </form>

        {status === 'error' && (
          <div className="login-message error">{message}</div>
        )}
        {status === 'success' && (
          <div className="login-message success">{message}</div>
        )}
      </div>
    </div>
  );
}
