import { useState, useEffect, useCallback } from 'react';
import { Key, Sun, Moon, Monitor, Bell, Stethoscope } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { useTheme } from '../../../hooks/useTheme';
import { api } from '../../../api/client';
import type { VetProfile, OwnerProfile } from '@vetvault/shared';

interface AccountSettingsTabProps {
  profile: VetProfile | OwnerProfile | undefined;
  user: {
    id: string;
    email: string;
    rol: string;
  } | null;
  refetch: () => void;
}

const themeOptions = [
  { value: 'light' as const, label: 'Claro', icon: Sun },
  { value: 'dark' as const, label: 'Oscuro', icon: Moon },
  { value: 'system' as const, label: 'Sistema', icon: Monitor },
];

const durationOptions = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '60 min' },
];

export function AccountSettingsTab({ profile, user, refetch }: AccountSettingsTabProps) {
  const { theme, setTheme } = useTheme();

  const isVet = user?.rol === 'Veterinario';
  const vetProfile = profile as VetProfile | undefined;
  const clinics = vetProfile?.clinicas || [];

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  const ls = (key: string, fallback: string): string => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  };

  const [defaultClinic, setDefaultClinic] = useState<string>(() => ls('vetvault-default-clinic', ''));
  const [apptDuration, setApptDuration] = useState<string>(() => ls('vetvault-appt-duration', '30'));
  const [compactMode, setCompactMode] = useState<boolean>(() => ls('vetvault-compact', 'false') === 'true');

  const [notifyAppointments, setNotifyAppointments] = useState<boolean>(() => ls('vetvault-notify-appt', 'false') === 'true');
  const [notifyVaccines, setNotifyVaccines] = useState<boolean>(() => ls('vetvault-notify-vaccines', 'false') === 'true');

  useEffect(() => {
    if (profile?.usuario?.email) setEmail(profile.usuario.email);
    else if (user?.email) setEmail(user.email);
  }, [profile, user]);

  const applyCompactMode = useCallback((compact: boolean) => {
    document.documentElement.setAttribute('data-compact', String(compact));
  }, []);

  useEffect(() => {
    applyCompactMode(compactMode);
  }, [compactMode, applyCompactMode]);

  const savePreference = (key: string, value: string | boolean) => {
    try { localStorage.setItem(key, String(value)); } catch {}
  };

  const handleDefaultClinicChange = (val: string) => {
    setDefaultClinic(val);
    savePreference('vetvault-default-clinic', val);
  };

  const handleApptDurationChange = (val: string) => {
    setApptDuration(val);
    savePreference('vetvault-appt-duration', val);
  };

  const handleCompactToggle = () => {
    const next = !compactMode;
    setCompactMode(next);
    savePreference('vetvault-compact', next);
  };

  const handleNotifyApptToggle = () => {
    const next = !notifyAppointments;
    setNotifyAppointments(next);
    savePreference('vetvault-notify-appt', next);
  };

  const handleNotifyVaccinesToggle = () => {
    const next = !notifyVaccines;
    setNotifyVaccines(next);
    savePreference('vetvault-notify-vaccines', next);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (newPassword && newPassword !== confirmPassword) {
      setSettingsError('Las contraseñas no coinciden');
      return;
    }

    setSavingSettings(true);
    setSettingsError('');
    setSettingsSuccess('');

    try {
      const body: Record<string, string> = {};
      if (email && email !== profile?.usuario?.email) body.email = email;
      if (newPassword) body.password = newPassword;

      if (Object.keys(body).length === 0) {
        setSettingsError('No hay cambios para guardar');
        setSavingSettings(false);
        return;
      }

      await api.patch(`/usuarios/${user.id}`, body);
      setSettingsSuccess('Datos de cuenta actualizados correctamente.');
      setNewPassword('');
      setConfirmPassword('');
      refetch();
      setTimeout(() => setSettingsSuccess(''), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar los datos de cuenta';
      setSettingsError(message);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Appearance */}
      <Card>
        <h3 className="perfil-section-title">Apariencia</h3>

        <div className="perfil-edit-form">
          <div className="form-group">
            <label className="form-label">Tema</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-inner)',
                      border: isActive ? '2px solid var(--accent, var(--accent-blue))' : '1px solid var(--border)',
                      background: isActive ? 'var(--accent-light, rgba(14,165,233,0.1))' : 'var(--surface-solid)',
                      color: isActive ? 'var(--accent, var(--accent-blue))' : 'var(--text)',
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.875rem',
                      fontFamily: 'var(--sans)',
                      transition: 'all var(--transition)',
                    }}
                  >
                    <Icon size={16} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label className="form-label" style={{ marginBottom: 2 }}>Modo Compacto</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Reduce el espaciado y tamaño de elementos para mostrar más información
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={compactMode}
              onClick={handleCompactToggle}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                background: compactMode ? 'var(--accent, var(--accent-blue))' : 'var(--border)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background var(--transition)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: compactMode ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left var(--transition)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Vet preferences */}
      {isVet && (
        <Card>
          <h3 className="perfil-section-title">
            <Stethoscope size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
            Preferencias de Consulta
          </h3>

          <div className="perfil-edit-form">
            <Select
              label="Clínica por Defecto"
              value={defaultClinic}
              onChange={(e) => handleDefaultClinicChange(e.target.value)}
                options={
                  clinics.length > 0
                    ? clinics.map((c: { id: string; nombre_comercial: string }) => ({ value: c.id, label: c.nombre_comercial }))
                    : []
                }
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: -8 }}>
              Se preseleccionará esta clínica al crear turnos y consultas
            </p>

            <Select
              label="Duración de Turno por Defecto"
              value={apptDuration}
              onChange={(e) => handleApptDurationChange(e.target.value)}
              options={durationOptions}
            />
          </div>
        </Card>
      )}

      {/* Notifications */}
      <Card>
        <h3 className="perfil-section-title">
          <Bell size={16} style={{ verticalAlign: -2, marginRight: 6 }} />
          Notificaciones
        </h3>

        <div className="perfil-edit-form">
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label className="form-label" style={{ marginBottom: 2 }}>Recordatorio de Turnos</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Notificar antes de un turno próximo
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Próximamente</span>
              <button
                type="button"
                role="switch"
                aria-checked={notifyAppointments}
                onClick={handleNotifyApptToggle}
                disabled
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  background: notifyAppointments ? 'var(--accent, var(--accent-blue))' : 'var(--border)',
                  cursor: 'not-allowed',
                  position: 'relative',
                  transition: 'background var(--transition)',
                  flexShrink: 0,
                  opacity: 0.5,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: notifyAppointments ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left var(--transition)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label className="form-label" style={{ marginBottom: 2 }}>Alertas de Vacunas</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Notificar cuando una vacuna esté próxima a vencer
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Próximamente</span>
              <button
                type="button"
                role="switch"
                aria-checked={notifyVaccines}
                onClick={handleNotifyVaccinesToggle}
                disabled
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  background: notifyVaccines ? 'var(--accent, var(--accent-blue))' : 'var(--border)',
                  cursor: 'not-allowed',
                  position: 'relative',
                  transition: 'background var(--transition)',
                  flexShrink: 0,
                  opacity: 0.5,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: notifyVaccines ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left var(--transition)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card>
        <h3 className="perfil-section-title">Ajustes de Cuenta</h3>

        {settingsSuccess && (
          <div className="login-message success" style={{ marginBottom: 'var(--space-md)' }}>
            {settingsSuccess}
          </div>
        )}

        {settingsError && (
          <div className="login-message error" style={{ marginBottom: 'var(--space-md)' }}>
            {settingsError}
          </div>
        )}

        <form onSubmit={handleUpdateSettings} className="perfil-edit-form">
          <Input
            label="Correo Electrónico de Cuenta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="divider" style={{ margin: 'var(--space-md) 0' }} />

          <h4
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-h)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 'var(--space-xs)',
            }}
          >
            <Key size={14} /> Cambiar Contraseña
          </h4>

          <div className="form-row">
            <Input
              label="Nueva Contraseña"
              type="password"
              placeholder="Dejar vacío para no cambiar"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
            />
            <Input
              label="Confirmar Nueva Contraseña"
              type="password"
              placeholder="Dejar vacío para no cambiar"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <div className="perfil-edit-actions">
            <Button type="submit" disabled={savingSettings}>
              {savingSettings ? 'Guardando...' : 'Actualizar Ajustes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
