import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PawPrint, Stethoscope, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export function RegisterPage() {
  const { toast } = useToast();
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
          const res = await api.get<{ isValid: boolean }>(
            `/auth/validar-matricula?matricula=${encodeURIComponent(matricula.trim())}`
          );
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
        toast.warning('Las contraseñas no coinciden');
        return;
      }
    }
    if (step === 3 && role === 'Veterinario' && licenseStatus !== 'valid') {
      toast.warning('Por favor ingrese una matrícula profesional válida');
      return;
    }
    setStep((prev) => Math.min(prev + 1, maxSteps));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setStatus('loading');

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
        const checkoutResponse = await api.post<{ initPoint: string }>(
          '/suscripciones/checkout',
          {
            plan: selectedPlan,
          }
        );

        if (checkoutResponse.initPoint) {
          window.location.href = checkoutResponse.initPoint;
        } else {
          throw new Error('No se pudo generar el link de pago. Por favor contacte soporte.');
        }
      }
    } catch (err: any) {
      setStatus('error');
      const msg = err.message || 'Error al completar el registro. Intente nuevamente.';
      toast.error(msg);
    }
  };

  const isStepValid = () => {
    if (step === 1) return !!role;
    if (step === 2)
      return (
        email &&
        password &&
        confirmPassword &&
        password === confirmPassword &&
        password.length >= 6
      );
    if (step === 3) {
      if (role === 'Propietario') {
        return nombre && apellido && telefono && (!esEmpresa || razonSocial);
      } else {
        return nombre && apellido && telefono && matricula && licenseStatus === 'valid';
      }
    }
    if (step === 4) {
      return clinicaNombre && clinicaDireccion && clinicaTelefono;
    }
    if (step === 5) {
      return !!selectedPlan;
    }
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] font-sans">
      <div className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-[var(--surface-solid)] border border-[var(--border)] shadow-2xl backdrop-blur-xl animate-fade-in space-y-6 text-[var(--text)]">
        {/* Brand */}
        <div className="text-center">
          <h1 className="font-heading font-extrabold text-3xl text-[var(--text-h)] tracking-tight">
            Vet<span className="bg-gradient-to-r from-sky-500 to-emerald-500 bg-clip-text text-transparent">Vault</span>
          </h1>
        </div>

        {/* Stepper Progress */}
        <div className="relative flex justify-between items-center px-4">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[var(--border)] -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-4 h-0.5 bg-sky-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / (maxSteps - 1)) * 100}%` }}
          />
          {Array.from({ length: maxSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                step === i + 1
                  ? 'bg-sky-500 text-white border-sky-500 shadow-md ring-4 ring-sky-500/20'
                  : step > i + 1
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-[var(--surface-solid)] text-[var(--text-muted)] border-[var(--border)]'
              )}
            >
              {step > i + 1 ? '✓' : i + 1}
            </div>
          ))}
        </div>

        {/* Form container */}
        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[var(--text-h)]">
                  Selecciona tu perfil
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Elige cómo vas a utilizar VetVault
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div
                  className={cn(
                    'p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-3',
                    role === 'Propietario'
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-md'
                      : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-emerald-500'
                  )}
                  onClick={() => {
                    setRole('Propietario');
                    setStep(2);
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <PawPrint size={28} />
                  </div>
                  <h3 className="font-bold text-base text-[var(--text-h)]">
                    Tutor / Dueño
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Quiero consultar el historial de mi mascota, vacunas, atenciones y agendar turnos de manera gratuita.
                  </p>
                </div>

                <div
                  className={cn(
                    'p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center space-y-3',
                    role === 'Veterinario'
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 shadow-md'
                      : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-sky-500'
                  )}
                  onClick={() => {
                    setRole('Veterinario');
                    setStep(2);
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Stethoscope size={28} />
                  </div>
                  <h3 className="font-bold text-base text-[var(--text-h)]">
                    Veterinario / Clínica
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Quiero administrar consultas clínicas, registrar vacunas, recetar tratamientos y gestionar mi agenda médica.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[var(--text-h)]">
                  Crear tu cuenta
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Ingresa tus credenciales de inicio de sesión
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-xs font-semibold text-[var(--text-h)] tracking-wide">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text-h)] placeholder-[var(--text-muted)] text-sm transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
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

                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-300',
                            passwordStrength === 'strong'
                              ? 'w-full bg-emerald-500'
                              : passwordStrength === 'medium'
                              ? 'w-2/3 bg-amber-500'
                              : 'w-1/3 bg-red-500'
                          )}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Seguridad:</span>
                        <span
                          className={cn(
                            'font-semibold',
                            passwordStrength === 'strong'
                              ? 'text-emerald-600'
                              : passwordStrength === 'medium'
                              ? 'text-amber-600'
                              : 'text-red-600'
                          )}
                        >
                          {passwordStrength === 'strong'
                            ? 'Fuerte'
                            : passwordStrength === 'medium'
                            ? 'Media'
                            : 'Débil'}
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
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[var(--text-h)]">
                  Información Personal
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Cuéntanos un poco sobre ti
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="esEmpresa"
                        checked={esEmpresa}
                        onChange={(e) => setEsEmpresa(e.target.checked)}
                        className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer w-4 h-4"
                      />
                      <label
                        htmlFor="esEmpresa"
                        className="text-xs font-medium text-[var(--text-h)] cursor-pointer"
                      >
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
                      <div
                        className={cn(
                          'p-2.5 rounded-xl text-xs font-semibold',
                          licenseStatus === 'valid'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-900/60'
                            : licenseStatus === 'invalid'
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-900/60'
                            : 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 border border-sky-200 dark:border-sky-900/60 animate-pulse'
                        )}
                      >
                        {licenseStatus === 'checking' &&
                          'Verificando en Colegio de Veterinarios de Córdoba...'}
                        {licenseStatus === 'valid' &&
                          '✓ Matrícula habilitada en Colegio de Córdoba'}
                        {licenseStatus === 'invalid' &&
                          '✗ Matrícula no encontrada o inhabilitada'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {step === 4 && role === 'Veterinario' && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[var(--text-h)]">
                  Detalles de tu Clínica
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Ingresa la información básica del centro veterinario principal
                </p>
              </div>

              <div className="space-y-4">
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
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-[var(--text-h)]">
                  Suscripción de Cuenta
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Selecciona el plan que mejor se adapte a tu gestión
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div
                  className={cn(
                    'p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4',
                    selectedPlan === 'independent'
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 shadow-md ring-2 ring-sky-500/20'
                      : 'border-[var(--border)] bg-[var(--surface-solid)] hover:border-sky-500'
                  )}
                  onClick={() => setSelectedPlan('independent')}
                >
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-h)]">
                      Veterinario Independiente
                    </h3>
                    <div className="text-2xl font-extrabold text-[var(--text-h)] mt-2">
                      $19.000 <span className="text-xs font-normal text-[var(--text-muted)]">/ mes (ARS)</span>
                    </div>
                    <ul className="text-xs text-[var(--text-muted)] space-y-2 mt-4">
                      <li>✓ 1 Cuenta de Veterinario</li>
                      <li>✓ Hasta 150 Pacientes</li>
                      <li>✓ Historias Clínicas Completas</li>
                      <li>✓ Calendario de Vacunación</li>
                      <li>✓ Soporte Estándar</li>
                    </ul>
                  </div>
                </div>

                <div
                  className={cn(
                    'p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative',
                    selectedPlan === 'clinic_pro'
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 shadow-md ring-2 ring-sky-500/20'
                      : 'border-[var(--border)] bg-[var(--surface-solid)] hover:border-sky-500'
                  )}
                  onClick={() => setSelectedPlan('clinic_pro')}
                >
                  <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white shadow-xs">
                    Más Elegido
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-h)]">
                      Clínica Pro
                    </h3>
                    <div className="text-2xl font-extrabold text-[var(--text-h)] mt-2">
                      $49.000 <span className="text-xs font-normal text-[var(--text-muted)]">/ mes (ARS)</span>
                    </div>
                    <ul className="text-xs text-[var(--text-muted)] space-y-2 mt-4">
                      <li>✓ Hasta 5 Cuentas (Vets/Recepcionistas)</li>
                      <li>✓ Pacientes Ilimitados</li>
                      <li>✓ IA Voice Scribe (100 min/mes)</li>
                      <li>✓ Dashboard Clínico Avanzado</li>
                      <li>✓ Soporte Prioritario 24/7</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stepper Footer Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
          {step > 1 ? (
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={status === 'loading'}
            >
              <ArrowLeft size={16} />
              Atrás
            </Button>
          ) : (
            <div />
          )}

          {step < maxSteps ? (
            <Button onClick={handleNext} disabled={!isStepValid()}>
              Continuar
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || status === 'loading'}
            >
              {status === 'loading'
                ? 'Procesando...'
                : role === 'Veterinario'
                ? 'Ir a Mercado Pago'
                : 'Completar Registro'}
              {status !== 'loading' && <ArrowRight size={16} />}
            </Button>
          )}
        </div>

        <div className="text-center text-xs text-[var(--text-muted)]">
          <span>¿Ya tenés una cuenta? </span>
          <Link
            to="/login"
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            Inicia Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
