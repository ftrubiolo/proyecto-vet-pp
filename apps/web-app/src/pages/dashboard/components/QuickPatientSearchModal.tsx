import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PawPrint, Zap, ExternalLink, Plus, X } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { calcAge, type Mascota } from '@vetvault/shared';

export interface QuickPatientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mascotas: Mascota[];
  clinicaId?: string;
  onNewPatientClick?: () => void;
}

export function QuickPatientSearchModal({
  isOpen,
  onClose,
  mascotas = [],
  clinicaId,
  onNewPatientClick,
}: QuickPatientSearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mascotas.slice(0, 10);
    return mascotas.filter((m) => {
      const matchName = m.nombre?.toLowerCase().includes(q);
      const matchBreed = m.raza?.toLowerCase().includes(q);
      const matchSpecies = m.especie?.toLowerCase().includes(q);
      const matchChip = m.numero_microchip?.toLowerCase().includes(q);
      return matchName || matchBreed || matchSpecies || matchChip;
    });
  }, [mascotas, query]);

  const handleVerFicha = (id: string) => {
    onClose();
    navigate(`/mascotas/${id}`);
  };

  const handleAtenderWalkIn = (id: string) => {
    onClose();
    const clinicParam = clinicaId ? `&clinicaId=${clinicaId}` : '';
    navigate(`/mascotas/${id}?iniciarConsulta=true${clinicParam}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buscar Paciente"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Search Input Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <Input
            autoFocus
            placeholder="Buscar por nombre, especie, raza o microchip..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-h)] cursor-pointer p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
          <span>
            {query.trim()
              ? `${filtered.length} paciente${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`
              : 'Pacientes registrados recientemente'}
          </span>
          {onNewPatientClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewPatientClick();
              }}
              className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Plus size={14} />
              Registrar nuevo
            </button>
          )}
        </div>

        {/* Results List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-solid)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] mb-3">
              <PawPrint size={24} />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-h)]">No se encontraron pacientes</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
              No hay coincidencias para &ldquo;{query}&rdquo;. Podés registrar a la mascota como nuevo paciente.
            </p>
            {onNewPatientClick && (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => {
                  onClose();
                  onNewPatientClick();
                }}
              >
                <Plus size={14} />
                Registrar Paciente
              </Button>
            )}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {m.foto_url ? (
                    <img
                      src={m.foto_url}
                      alt={m.nombre}
                      className="w-12 h-12 rounded-xl object-cover border border-[var(--border)] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                      <PawPrint size={22} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-h)] truncate">
                        {m.nombre}
                      </span>
                      {m.es_castrado && (
                        <Badge variant="accent" className="text-[10px] py-0 px-1.5">
                          Castrado
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {m.especie || 'Mascota'} · {m.raza || 'Sin raza'}
                      {m.fecha_nacimiento && ` · ${calcAge(m.fecha_nacimiento)}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleVerFicha(m.id)}
                    className="text-xs py-1.5 px-2.5"
                  >
                    <ExternalLink size={13} />
                    Ver Ficha
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAtenderWalkIn(m.id)}
                    className="text-xs py-1.5 px-2.5"
                  >
                    <Zap size={13} />
                    Atender
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
