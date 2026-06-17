import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, Stethoscope, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import './RegisterPage.css';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Navigation stepper state
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'Propietario' | 'Veterinario' | null>(null);

  // Step 2: Account Details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Step 3: Profile Details
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  
  // Vets specific
  const [matricula, setMatricula] = useState('');
  const [licenseStatus, setLicenseStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  
  // Vet clinic specific
  const [clinicaNombre, setClinicaNombre] = useState('');
  const [clinicaDireccion, setClinicaDireccion] = useState('');
  const [clinicaTelefono, setClinicaTelefono] = useState('');

  // Owner specific
  const [esEmpresa, setEsEmpresa] = useState(false);
  const [razonSocial, setRazonSocial] = useState('');

  // Step 4: Plan Selection (Vets only)
  const [selectedPlan, setSelectedPlan] = useState<'independent' | 'clinic_pro'>('clinic_pro');

  // Request States
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Password Strength Checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength('weak');
      return;
    }
    const hasLength = password.length >= 6;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    const score = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

    if (score <= 2) {
      setPasswordStrength('weak');
    } else if (score === 3) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [password]);

  // Debounced License Check
  useEffect(() => {
    if (role === 'Veterinario' && matricula.trim().length >= 3) {
      setLicenseStatus('checking');
      const delayDebounceFn = setTimeout(async () => {
        try {
          const res = await api.get<{ isValid: boolean }>(`/auth/validar-matricula?matricula=${encodeURIComponent(matricula.trim())}`);
          if (res.isValid) {
            setLicenseStatus('valid');
          } else {
            setLicenseStatus('invalid');
          }
        } catch {
          setLicenseStatus('invalid');
        }
      }, 600);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setLicenseStatus('idle');
    }
  }, [matricula, role]);

  const maxSteps = role === 'Veterinario' ? 5 : 3;

  const handleNext = () => {
    if (step === 1 && !role) return;
    if (step === 2) {
      if (password !== confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      setErrorMessage('');
    }
    setStep((prev) => Math.min(prev + 1, maxSteps));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    setErrorMessage('');
  };

  const handleSubmit = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      if (role === 'Propietario') {
        // Submit Proprietor Registration
        await api.post('/auth/register/propietario', {
          usuario: { email, password },
          propietario: {
            nombre,
            apellido,
            esEmpresa,
            razonSocial: esEmpresa ? razonSocial : undefined,
            telefono,
            direccion: direccion || undefined,
          },
        });

        // Auto login on success
        await login(email, password);
        navigate('/dashboard', { replace: true });
      } else if (role === 'Veterinario') {
        if (licenseStatus !== 'valid') {
          throw new Error('Debe ingresar una matrícula habilitada para continuar');
        }

        // Register Vet (returns user info)
        await api.post('/auth/register/veterinario', {
          usuario: { email, password, rol: 'Veterinario' },
          veterinario: {
            nombre,
            apellido,
            numero_matricula: matricula,
            telefono,
          },
          clinica: {
            nombre_comercial: clinicaNombre,
            direccion: clinicaDireccion,
            telefono: clinicaTelefono,
          },
        });

        // Authenticate the user to start their checkout session
        await login(email, password);

        // Call the checkout session to get Mercado Pago preference
        const checkoutResponse = await api.post<{ initPoint: string }>('/suscripciones/checkout', {
          plan: selectedPlan,
        });

        if (checkoutResponse.initPoint) {
          // Redirect the user to Mercado Pago checkout
          window.location.href = checkoutResponse.initPoint;
        } else {
          throw new Error('No se pudo generar el link de pago. Por favor contacte soporte.');
        }
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Error al completar el registro. Intente nuevamente.');
    }
  };

  // Helper validation to block next step triggers
  const isStepValid = () => {
    if (step === 1) return !!role;
    if (step === 2) return email && password && confirmPassword && password === confirmPassword && password.length >= 6;
    if (step === 3) {
      if (role === 'Propietario') {
        return nombre && apellido && telefono && (!esEmpresa || razonSocial);
      } else {
        return nombre && apellido && telefono && matricula && licenseStatus === 'valid';
      }
    }
    if (step === 4) {
      // Clinic info for vets
      return clinicaNombre && clinicaDireccion && clinicaTelefono;
    }
    if (step === 5) {
      return !!selectedPlan;
    }
    return true;
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-brand">
          <h1 className="register-brand-title">
            Vet<span>Vault</span>
          </h1>
        </div>

        {/* Progress Stepper indicator */}
        <div className="stepper-progress">
          <div
            className="stepper-progress-fill"
            style={{ width: `${((step - 1) / (maxSteps - 1)) * 100}%` }}
          />
          {Array.from({ length: maxSteps }).map((_, i) => (
            <div
              key={i}
              className={`step-node ${step === i + 1 ? 'active' : ''} ${
                step > i + 1 ? 'completed' : ''
              }`}
            >
              {step > i + 1 ? '✓' : i + 1}
            </div>
          ))}
        </div>

        {/* Form container */}
        <div className="step-content">
          {step === 1 && (
            <div>
              <h2 className="step-title">Selecciona tu perfil</h2>
              <p className="step-subtitle">Elige cómo vas a utilizar VetVault</p>
              
              <div className="role-cards-container">
                <div
                  className={`role-card ${role === 'Propietario' ? 'selected' : ''}`}
                  onClick={() => {
                    setRole('Propietario');
                    setStep(2);
                  }}
                >
                  <div className="role-card-icon">
                    <PawPrint size={28} />
                  </div>
                  <h3 className="role-card-title">Tutor / Dueño</h3>
                  <p className="role-card-description">
                    Quiero consultar el historial de mi mascota, vacunas, atenciones y agendar turnos de manera gratuita.
                  </p>
                </div>

                <div
                  className={`role-card ${role === 'Veterinario' ? 'selected' : ''}`}
                  onClick={() => {
                    setRole('Veterinario');
                    setStep(2);
                  }}
                >
                  <div className="role-card-icon">
                    <Stethoscope size={28} />
                  </div>
                  <h3 className="role-card-title">Veterinario / Clínica</h3>
                  <p className="role-card-description">
                    Quiero administrar consultas clínicas, registrar vacunas, recetar tratamientos y gestionar mi agenda médica.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="step-title">Crear tu cuenta</h2>
              <p className="step-subtitle">Ingresa tus credenciales de inicio de sesión</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="password-container">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Contraseña</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ paddingRight: '40px', width: '100%' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {password && (
                    <div className="password-strength-container">
                      <div className="password-strength-bar-bg">
                        <div className={`password-strength-bar-fill ${passwordStrength}`} />
                      </div>
                      <div className="password-strength-text">
                        <span>Seguridad:</span>
                        <span style={{
                          color: passwordStrength === 'strong' ? 'var(--success)' : 
                                 passwordStrength === 'medium' ? '#f97316' : 'var(--danger)'
                        }}>
                          {passwordStrength === 'strong' ? 'Fuerte' : 
                           passwordStrength === 'medium' ? 'Media' : 'Débil'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirmar Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="step-title">Información Personal</h2>
              <p className="step-subtitle">Cuéntanos un poco sobre ti</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div className="form-grid-2">
                  <Input
                    label="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  <Input
                    label="Apellido"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Teléfono de Contacto"
                  type="tel"
                  placeholder="351 1234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                />

                {role === 'Propietario' ? (
                  <>
                    <Input
                      label="Dirección (Opcional)"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                    />
                    <div className="form-group-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                      <input
                        type="checkbox"
                        id="esEmpresa"
                        checked={esEmpresa}
                        onChange={(e) => setEsEmpresa(e.target.checked)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <label htmlFor="esEmpresa" style={{ fontSize: '0.875rem', color: 'var(--text-h)', cursor: 'pointer' }}>
                        Represento a una empresa (ej. Refugio, Criadero)
                      </label>
                    </div>

                    {esEmpresa && (
                      <Input
                        label="Razón Social"
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        required
                      />
                    )}
                  </>
                ) : (
                  <>
                    <Input
                      label="Número de Matrícula Profesional"
                      placeholder="M.P. 1234"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      required
                    />
                    {matricula && (
                      <div className={`license-validation-status ${
                        licenseStatus === 'valid' ? 'valid' : 
                        licenseStatus === 'invalid' ? 'invalid' : 'checking'
                      }`}>
                        {licenseStatus === 'checking' && 'Verificando en Colegio de Veterinarios de Córdoba...'}
                        {licenseStatus === 'valid' && '✓ Matrícula habilitada en Colegio de Córdoba'}
                        {licenseStatus === 'invalid' && '✗ Matrícula no encontrada o inhabilitada'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {step === 4 && role === 'Veterinario' && (
            <div>
              <h2 className="step-title">Detalles de tu Clínica</h2>
              <p className="step-subtitle">Ingresa la información básica del centro veterinario principal</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <Input
                  label="Nombre Comercial de la Clínica"
                  placeholder="Veterinaria Patitas"
                  value={clinicaNombre}
                  onChange={(e) => setClinicaNombre(e.target.value)}
                  required
                />
                <Input
                  label="Dirección Física"
                  placeholder="Av. Colón 1234, Córdoba"
                  value={clinicaDireccion}
                  onChange={(e) => setClinicaDireccion(e.target.value)}
                  required
                />
                <Input
                  label="Teléfono de la Clínica"
                  placeholder="0351 4567890"
                  value={clinicaTelefono}
                  onChange={(e) => setClinicaTelefono(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {step === 5 && role === 'Veterinario' && (
            <div>
              <h2 className="step-title">Suscripción de Cuenta</h2>
              <p className="step-subtitle">Selecciona el plan de Mercado Pago que mejor se adapte a tu gestión</p>

              <div className="plans-container">
                <div
                  className={`plan-card ${selectedPlan === 'independent' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan('independent')}
                >
                  <h3 className="plan-name">Veterinario Independiente</h3>
                  <div className="plan-price">
                    $19.000 <span>/ mes (ARS)</span>
                  </div>
                  <ul className="plan-features">
                    <li>1 Cuenta de Veterinario</li>
                    <li>Hasta 150 Pacientes</li>
                    <li>Historias Clínicas Completas</li>
                    <li>Calendario de Vacunación</li>
                    <li>Soporte Estándar</li>
                  </ul>
                </div>

                <div
                  className={`plan-card ${selectedPlan === 'clinic_pro' ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan('clinic_pro')}
                >
                  <div className="plan-badge">Más Elegido</div>
                  <h3 className="plan-name">Clínica Pro</h3>
                  <div className="plan-price">
                    $49.000 <span>/ mes (ARS)</span>
                  </div>
                  <ul className="plan-features">
                    <li>Hasta 5 Cuentas (Vets/Recepcionistas)</li>
                    <li>Pacientes Ilimitados</li>
                    <li>IA Voice Scribe (100 min/mes)</li>
                    <li>Dashboard Clínico Avanzado</li>
                    <li>Soporte Prioritario 24/7</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Display Error Message */}
        {errorMessage && (
          <div className="login-message error" style={{ marginTop: 'var(--space-md)' }}>
            {errorMessage}
          </div>
        )}

        {/* Stepper Footer Action Buttons */}
        <div className="stepper-actions">
          {step > 1 && (
            <button
              className="btn-back"
              onClick={handleBack}
              disabled={status === 'loading'}
            >
              <ArrowLeft size={16} style={{ marginRight: '6px', display: 'inline' }} />
              Atrás
            </button>
          )}
          
          {step < maxSteps ? (
            <button
              className="btn-next"
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Continuar
              <ArrowRight size={16} style={{ marginLeft: '6px', display: 'inline' }} />
            </button>
          ) : (
            <button
              className="btn-next"
              onClick={handleSubmit}
              disabled={!isStepValid() || status === 'loading'}
            >
              {status === 'loading' ? 'Procesando...' : role === 'Veterinario' ? 'Ir a Mercado Pago' : 'Completar Registro'}
              {status !== 'loading' && <ArrowRight size={16} style={{ marginLeft: '6px', display: 'inline' }} />}
            </button>
          )}
        </div>

        <div className="register-footer">
          <span>¿Ya tenés una cuenta? </span>
          <Link to="/login" className="register-link">
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
