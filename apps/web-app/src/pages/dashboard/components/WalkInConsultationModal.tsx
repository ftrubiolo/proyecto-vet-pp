import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Search, PawPrint, Building2, Plus, ArrowRight } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { calcAge, type Mascota } from '@vetvault/shared';

export interface WalkInConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mascotas: Mascota[];
  clinicaId?: string;
  clinicaNombre?: string;
  onNewPatientClick?: () => void;
}

export function WalkInConsultationModal({
  isOpen,
  onClose,
  mascotas = [],
  clinicaId,
  clinicaNombre,
  onNewPatientClick,
}: WalkInConsultationModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mascotas.slice(0, 8);
    return mascotas.filter((m) => {
      const matchName = m.nombre?.toLowerCase().includes(q);
      const matchBreed = m.raza?.toLowerCase().includes(q);
      const matchChip = m.numero_microchip?.toLowerCase().includes(q);
      return matchName || matchBreed || matchChip;
    });
  }, [mascotas, query]);

  const handleStartConsultation = (mascotaId?: string) => {
    const targetId = mascotaId || selectedId;
    if (!targetId) return;
    onClose();
    const clinicParam = clinicaId ? `&clinicaId=${clinicaId}` : '';
    navigate(`/mascotas/${targetId}?iniciarConsulta=true${clinicParam}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Iniciar Consulta Inmediata (Walk-in)"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          {onNewPatientClick ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onClose();
                onNewPatientClick();
              }}
              className="text-xs"
            >
              <Plus size={14} />
              Nuevo Paciente
            </Button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!selectedId}
              onClick={() => handleStartConsultation()}
            >
              <Zap size={14} />
              Comenzar Consulta
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Banner with clinic info */}
        {clinicaNombre && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text)]">
            <Building2 size={16} className="text-[var(--accent)] flex-shrink-0" />
            <span>
              Atención inmediata en <strong className="text-[var(--text-h)]">{clinicaNombre}</strong>
            </span>
          </div>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          Seleccioná al paciente que ingresó a consulta espontánea para abrir su formulario clínico inmediatamente:
        </p>

        {/* Filter Input */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <Input
            autoFocus
            placeholder="Buscar por nombre, raza o microchip..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Patient Selection List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <PawPrint size={32} className="text-[var(--text-muted)] mb-2" />
            <h5 className="text-sm font-bold text-[var(--text-h)]">Sin pacientes encontrados</h5>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              ¿Es una primera visita? Registrá al paciente antes de iniciar la consulta.
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {filtered.map((m) => {
              const isSelected = selectedId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-light)] border-[var(--accent)] shadow-sm'
                      : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {m.foto_url ? (
                      <img
                        src={m.foto_url}
                        alt={m.nombre}
                        className="w-11 h-11 rounded-xl object-cover border border-[var(--border)] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[var(--surface-solid)] text-[var(--accent)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                        <PawPrint size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--text-h)] truncate">
                          {m.nombre}
                        </span>
                        <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                          {m.sexo === 'M' ? 'Macho' : 'Hembra'}
                        </Badge>
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                        {m.especie || 'Mascota'} · {m.raza || 'Sin raza'}
                        {m.fecha_nacimiento && ` · ${calcAge(m.fecha_nacimiento)}`}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isSelected ? 'primary' : 'ghost'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartConsultation(m.id);
                    }}
                    className="text-xs flex-shrink-0"
                  >
                    Atender
                    <ArrowRight size={13} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
