import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Search, Plus, Calendar, Tag } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { CreatePacienteModal } from '../../components/mascotas/CreatePacienteModal';
import { type Mascota, type MascotasResponse, calcAge } from '@vetvault/shared';

export { CreatePacienteModal };

export function VetMascotas() {
  const navigate = useNavigate();

  // Fetch mascotas (Unified endpoint)
  const { data: mascotasData, isLoading, refetch } = useFetch<MascotasResponse | Mascota[]>('/mascotas');

  const mascotas: Mascota[] = Array.isArray(mascotasData)
    ? mascotasData
    : (mascotasData as MascotasResponse)?.mascotas || [];

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  // Filter
  const filtered = mascotas.filter((m) =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    m.raza?.toLowerCase().includes(search.toLowerCase()) ||
    m.especie?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-h)] font-[var(--heading)]">Pacientes</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Gestión de pacientes de la clínica</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Registrar Paciente
        </Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-10" />
          <Input
            placeholder="Buscar por nombre, raza o especie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="neutral">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16">
          <Spinner size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 border border-[var(--border)]">
          <EmptyState
            icon={<PawPrint size={56} />}
            title={search ? 'Sin resultados' : 'Sin pacientes registrados'}
            message={
              search
                ? `No se encontraron pacientes que coincidan con "${search}"`
                : 'Registrá tu primer paciente para comenzar.'
            }
            action={
              !search ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus size={16} />
                  Registrar Paciente
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m, i) => (
            <Card
              key={m.id}
              clickable
              onClick={() => navigate(`/mascotas/${m.id}`)}
              style={{ animationDelay: `${i * 50}ms` }}
              className="p-4 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                  <PawPrint size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-[var(--text-h)] truncate">{m.nombre}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {m.raza || 'Sin raza'} · {m.especie || ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {calcAge(m.fecha_nacimiento)}
                </span>
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {m.sexo === 'M' ? 'Macho' : 'Hembra'}
                </span>
                {m.es_castrado && (
                  <Badge variant="accent" className="text-xs">Castrado</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePacienteModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

