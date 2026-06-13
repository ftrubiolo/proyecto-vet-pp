import { Mail, Stethoscope, User } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import type { VetProfile, OwnerProfile } from '../types';

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
    <Card className="perfil-detail-card">
      <div className="perfil-detail-profile">
        <div
          className="perfil-detail-avatar"
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
        <div className="perfil-detail-info">
          <h2>{displayName}</h2>
          <div className="perfil-detail-email">
            <Mail size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            {profile?.usuario?.email || user?.email}
          </div>
          <div className="perfil-detail-badges">
            <Badge variant="accent">
              {isVet ? (
                <>
                  <Stethoscope size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
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
