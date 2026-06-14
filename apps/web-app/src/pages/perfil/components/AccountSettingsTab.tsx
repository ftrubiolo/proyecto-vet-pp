import { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
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

export function AccountSettingsTab({ profile, user, refetch }: AccountSettingsTabProps) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    if (profile?.usuario?.email) {
      setEmail(profile.usuario.email);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

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
      if (email && email !== profile?.usuario?.email) {
        body.email = email;
      }
      if (newPassword) {
        body.password = newPassword;
      }

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
    } catch (err: any) {
      setSettingsError(err.message || 'Error al actualizar los datos de cuenta');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
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

        <div className="divider" style={{ margin: 'var(--space-md) 0' }}></div>

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
  );
}
