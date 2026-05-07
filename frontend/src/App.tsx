import { useState } from 'react';
import './App.css';

type Mode = 'login' | 'register';
type Role = 1 | 2; // 1: Veterinario, 2: Propietario

export default function App() {
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>(2);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // Role specific states
  const [direccion, setDireccion] = useState('');
  const [numeroMatricula, setNumeroMatricula] = useState('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    if (mode === 'login') {
      // Simulate login for now
      setTimeout(() => {
        setStatus('success');
        setMessage('Inicio de sesión exitoso (Simulado)');
      }, 1000);
      return;
    }

    // Registration flow
    try {
      const payload: any = {
        email,
        password,
        rol: role,
        nombre,
        apellido,
        telefono
      };

      if (role === 1) payload.numeroMatricula = numeroMatricula;
      if (role === 2) payload.direccion = direccion;

      const response = await fetch('http://localhost:5000/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Algo salió mal');
      }

      setStatus('success');
      setMessage(`¡Bienvenido, ${data.nombre || 'Usuario'}! Cuenta creada con éxito.`);
      
      // Reset form
      setEmail('');
      setPassword('');
      setNombre('');
      setApellido('');
      setTelefono('');
      setDireccion('');
      setNumeroMatricula('');
      
      // Switch back to login
      setTimeout(() => {
        setMode('login');
        setStatus('idle');
        setMessage('');
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Error al conectar con el servidor');
    }
  };

  return (
    <div className="glass-card">
      <div className="mode-toggle">
        <button 
          type="button"
          className={mode === 'login' ? 'active' : ''} 
          onClick={() => { setMode('login'); setStatus('idle'); setMessage(''); }}
        >
          Ingresar
        </button>
        <button 
          type="button"
          className={mode === 'register' ? 'active' : ''} 
          onClick={() => { setMode('register'); setStatus('idle'); setMessage(''); }}
        >
          Registrarse
        </button>
      </div>

      <div className="login-header">
        <h1>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crear Cuenta'}</h1>
        <p>{mode === 'login' ? 'Inicie sesión en su portal médico' : 'Complete sus datos para registrarse'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div className="role-toggle">
            <button 
              type="button"
              className={role === 2 ? 'active' : ''} 
              onClick={() => setRole(2)}
            >
              Propietario
            </button>
            <button 
              type="button"
              className={role === 1 ? 'active' : ''} 
              onClick={() => setRole(1)}
            >
              Veterinario
            </button>
          </div>
        )}

        {mode === 'register' && (
          <>
            <div className="input-group row">
              <input type="text" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required disabled={status === 'loading'} />
              <input type="text" placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} required disabled={status === 'loading'} />
            </div>
            <div className="input-group">
              <input type="tel" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} required disabled={status === 'loading'} />
            </div>

            {role === 1 && (
              <div className="input-group">
                <input type="text" placeholder="Número de Matrícula" value={numeroMatricula} onChange={(e) => setNumeroMatricula(e.target.value)} required disabled={status === 'loading'} />
              </div>
            )}

            {role === 2 && (
              <div className="input-group">
                <input type="text" placeholder="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} required disabled={status === 'loading'} />
              </div>
            )}
          </>
        )}

        <div className="input-group">
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={status === 'loading'}
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={status === 'loading'}
        >
          {status === 'loading' 
            ? 'Procesando...' 
            : mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
        </button>
      </form>

      {status === 'error' && (
        <div className="message error">
          {message}
        </div>
      )}

      {status === 'success' && (
        <div className="message success">
          {message}
        </div>
      )}
    </div>
  );
}
