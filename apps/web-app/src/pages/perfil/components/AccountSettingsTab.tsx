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
    <div className="flex flex-col gap-6">
      {/* Appearance */}
      <Card className="p-6 border border-[var(--border)]">
        <h3 className="text-base font-bold text-[var(--text-h)] mb-4">Apariencia</h3>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[var(--text-h)]">Tema</label>
            <div className="flex gap-2 flex-wrap">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all cursor-pointer ${
                      isActive
                        ? 'border-2 border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] font-semibold'
                        : 'border-[var(--border)] bg-[var(--surface-solid)] text-[var(--text)] hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <Icon size={16} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[var(--border)]">
            <div>
              <label className="text-sm font-semibold text-[var(--text-h)] block">Modo Compacto</label>
              <p className="text-xs text-[var(--text-muted)]">
                Reduce el espaciado y tamaño de elementos para mostrar más información
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={compactMode}
              onClick={handleCompactToggle}
              className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer flex-shrink-0 ${
                compactMode ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                  compactMode ? 'left-[22px]' : 'left-[2px]'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Vet preferences */}
      {isVet && (
        <Card className="p-6 border border-[var(--border)]">
          <h3 className="text-base font-bold text-[var(--text-h)] mb-4 flex items-center gap-2">
            <Stethoscope size={16} className="text-[var(--accent)]" />
            Preferencias de Consulta
          </h3>

          <div className="flex flex-col gap-4">
            <div>
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
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Se preseleccionará esta clínica al crear turnos y consultas
              </p>
            </div>

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
      <Card className="p-6 border border-[var(--border)]">
        <h3 className="text-base font-bold text-[var(--text-h)] mb-4 flex items-center gap-2">
          <Bell size={16} className="text-[var(--accent)]" />
          Notificaciones
        </h3>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-semibold text-[var(--text-h)] block">Recordatorio de Turnos</label>
              <p className="text-xs text-[var(--text-muted)]">
                Notificar antes de un turno próximo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] italic">Próximamente</span>
              <button
                type="button"
                role="switch"
                aria-checked={notifyAppointments}
                onClick={handleNotifyApptToggle}
                disabled
                className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 opacity-50 cursor-not-allowed ${
                  notifyAppointments ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                    notifyAppointments ? 'left-[22px]' : 'left-[2px]'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[var(--border)]">
            <div>
              <label className="text-sm font-semibold text-[var(--text-h)] block">Alertas de Vacunas</label>
              <p className="text-xs text-[var(--text-muted)]">
                Notificar cuando una vacuna esté próxima a vencer
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)] italic">Próximamente</span>
              <button
                type="button"
                role="switch"
                aria-checked={notifyVaccines}
                onClick={handleNotifyVaccinesToggle}
                disabled
                className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 opacity-50 cursor-not-allowed ${
                  notifyVaccines ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                    notifyVaccines ? 'left-[22px]' : 'left-[2px]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Account */}
      <Card className="p-6 border border-[var(--border)]">
        <h3 className="text-base font-bold text-[var(--text-h)] mb-4">Ajustes de Cuenta</h3>

        {settingsSuccess && (
          <div className="p-3 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 mb-4">
            {settingsSuccess}
          </div>
        )}

        {settingsError && (
          <div className="p-3 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 mb-4">
            {settingsError}
          </div>
        )}

        <form onSubmit={handleUpdateSettings} className="flex flex-col gap-4">
          <Input
            label="Correo Electrónico de Cuenta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="h-[1px] bg-[var(--border)] my-2" />

          <h4 className="text-sm font-semibold text-[var(--text-h)] flex items-center gap-2">
            <Key size={14} className="text-[var(--accent)]" /> Cambiar Contraseña
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div className="flex justify-end gap-3 mt-2">
            <Button type="submit" disabled={savingSettings}>
              {savingSettings ? 'Guardando...' : 'Actualizar Ajustes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
