import { Mail, Stethoscope, User } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { VetProfile, OwnerProfile } from '@vetvault/shared';

interface ProfileHeaderProps {
  profile: VetProfile | OwnerProfile | undefined;
  user: {
    email: string;
    rol: string;
    vetId?: string;
    proId?: string;
  } | null;
  isVet: boolean;
}

export function ProfileHeader({ profile, user, isVet }: ProfileHeaderProps) {
  const displayName = profile ? `${profile.nombre} ${profile.apellido}` : user?.email || '';
  const hasFoto = !!(
    profile?.foto_url &&
    profile.foto_url !== 'null' &&
    profile.foto_url !== 'undefined' &&
    profile.foto_url.trim() !== ''
  );

  return (
    <Card className="p-6 border border-[var(--border)] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div
          className="w-28 h-28 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] flex-shrink-0 overflow-hidden"
          style={
            hasFoto
              ? {
                backgroundImage: `url(${profile?.foto_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
              : undefined
          }
        >
          {!hasFoto && <User size={40} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-[var(--text-h)]">{displayName}</h2>
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-1">
            <Mail size={14} />
            <span>{profile?.usuario?.email || user?.email}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="accent">
              {isVet ? (
                <>
                  <Stethoscope size={12} className="inline mr-1" />
                  Veterinario
                </>
              ) : (
                'Propietario'
              )}
            </Badge>
            {isVet && (profile as VetProfile)?.numero_matricula && (
              <Badge variant="neutral">
                M.P. {(profile as VetProfile).numero_matricula}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
