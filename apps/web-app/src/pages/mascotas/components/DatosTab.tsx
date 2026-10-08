import { Phone, Mail, MessageCircle, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { WeightChart } from './WeightChart';
import { formatDate, calcAge } from '@vetvault/shared'
import type { MascotaDetail } from '@vetvault/shared';

function formatWhatsAppLink(phone: string, text: string): string {
  let cleanNumber = phone.replace(/\D/g, '');
  if (!cleanNumber.startsWith('54')) {
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }
    if (cleanNumber.startsWith('15')) {
      cleanNumber = '9' + cleanNumber.substring(2);
    } else if (cleanNumber.length === 10 && !cleanNumber.startsWith('9')) {
      cleanNumber = '549' + cleanNumber;
    } else {
      cleanNumber = '54' + cleanNumber;
    }
  } else if (cleanNumber.startsWith('54') && !cleanNumber.startsWith('549') && cleanNumber.length === 12) {
    cleanNumber = '549' + cleanNumber.substring(2);
  }
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

interface DatosTabProps {
  mascota: MascotaDetail;
  isOwner: boolean;
  atenciones: any[];
  vacunas: any[];
  tratamientos: any[];
  onEditClick?: () => void;
}

export function DatosTab({ mascota, isOwner, atenciones, onEditClick }: DatosTabProps) {
  const { toast } = useToast();
  // Extract unique veterinarians from past care history
  const contactVets = Array.from(
    new Map(
      (atenciones || [])
        .filter((a) => a.veterinario)
        .map((a) => [a.veterinario.id, a.veterinario])
    ).values()
  );

  // Extract unique clinics from past care history
  const contactClinics = Array.from(
    new Map(
      (atenciones || [])
        .filter((a) => a.clinica)
        .map((a) => [a.clinica.id, a.clinica])
    ).values()
  );

  const checkIsNoAlerts = (val?: string) => {
    if (!val || val.trim() === '') return true;
    const clean = val.trim().toLowerCase();
    return ['ninguna', 'no presenta', 'no', 'sin alergias', 'sin alergias conocidas', 'sin condiciones', 'sin contraindicaciones', 'sano', 'ninguno'].includes(clean);
  };

  const hasActiveAlerts =
    (mascota.alergias && !checkIsNoAlerts(mascota.alergias)) ||
    (mascota.condiciones_cronicas && !checkIsNoAlerts(mascota.condiciones_cronicas)) ||
    (mascota.contraindicaciones && !checkIsNoAlerts(mascota.contraindicaciones));

  const renderAllergies = () => {
    const alergiasText = mascota.alergias;
    if (!alergiasText || alergiasText.trim() === '') {
      return !isOwner ? (
        <button type="button" onClick={onEditClick} className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline cursor-pointer">
          <Plus size={12} /> Registrar Alergia
        </button>
      ) : (
        <span className="text-xs text-[var(--text-muted)] italic">Sin registrar</span>
      );
    }

    const cleanText = alergiasText.trim().toLowerCase();
    if (cleanText === 'ninguna' || cleanText === 'sin alergias' || cleanText === 'no' || cleanText === 'no presenta' || cleanText === 'sin alergias conocidas' || cleanText === 'ninguno') {
      return (
        <Badge variant="success">
          ✓ Sin Alergias Conocidas
        </Badge>
      );
    }

    const list = alergiasText.split(',');
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {list.map((item, idx) => (
          <Badge key={idx} variant="danger">
            {item.trim()}
          </Badge>
        ))}
      </div>
    );
  };

  const renderChronicConditions = () => {
    const condText = mascota.condiciones_cronicas;
    if (!condText || condText.trim() === '') {
      return !isOwner ? (
        <button type="button" onClick={onEditClick} className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline cursor-pointer">
          <Plus size={12} /> Registrar Condición
        </button>
      ) : (
        <span className="text-xs text-[var(--text-muted)] italic">Sin registrar</span>
      );
    }
    const cleanText = condText.trim().toLowerCase();
    if (cleanText === 'ninguna' || cleanText === 'sin condiciones' || cleanText === 'no' || cleanText === 'no presenta' || cleanText === 'sano' || cleanText === 'ninguno') {
      return (
        <Badge variant="success">
          ✓ Ninguna
        </Badge>
      );
    }

    const list = condText.split(',');
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {list.map((item, idx) => (
          <Badge key={idx} variant="warning">
            {item.trim()}
          </Badge>
        ))}
      </div>
    );
  };

  const renderContraindications = () => {
    const contraText = mascota.contraindicaciones;
    if (!contraText || contraText.trim() === '') {
      return !isOwner ? (
        <button type="button" onClick={onEditClick} className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline cursor-pointer">
          <Plus size={12} /> Registrar Contraindicación
        </button>
      ) : (
        <span className="text-xs text-[var(--text-muted)] italic">Sin registrar</span>
      );
    }
    const cleanText = contraText.trim().toLowerCase();
    if (cleanText === 'ninguna' || cleanText === 'sin contraindicaciones' || cleanText === 'no' || cleanText === 'no presenta' || cleanText === 'ninguno') {
      return (
        <Badge variant="success">
          ✓ Ninguna
        </Badge>
      );
    }

    const list = contraText.split(',');
    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {list.map((item, idx) => (
          <Badge key={idx} variant="danger">
            {item.trim()}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className={`p-5 border transition-all ${hasActiveAlerts ? 'border-amber-500/40 bg-amber-500/5' : 'border-[var(--border)]'}`}>
        <h3 className="text-sm font-bold text-[var(--text-h)] mb-4">Alertas Clínicas y Seguridad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Alergias Conocidas</span>
            {renderAllergies()}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Condiciones Crónicas</span>
            {renderChronicConditions()}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Contraindicaciones</span>
            {renderContraindications()}
          </div>
        </div>
      </Card>

      <Card className="p-5 border border-[var(--border)]">
        <h3 className="text-sm font-bold text-[var(--text-h)] mb-4">Información General</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Nombre</span>
            <span className="text-sm font-semibold text-[var(--text-h)]">{mascota.nombre}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Especie</span>
            {mascota.especie ? (
              <span className="text-sm font-semibold text-[var(--text-h)]">{mascota.especie}</span>
            ) : (
              <span className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer" onClick={onEditClick}>
                + Agregar Especie
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Raza</span>
            {mascota.raza ? (
              <span className="text-sm font-semibold text-[var(--text-h)]">{mascota.raza}</span>
            ) : (
              <span className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer" onClick={onEditClick}>
                + Agregar Raza
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Fecha de Nacimiento</span>
            {mascota.fecha_nacimiento ? (
              <span className="text-sm font-semibold text-[var(--text-h)]">{formatDate(mascota.fecha_nacimiento)}</span>
            ) : (
              <span className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer" onClick={onEditClick}>
                + Agregar Fecha de Nacimiento
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Edad</span>
            <span className="text-sm font-semibold text-[var(--text-h)]">
              {mascota.fecha_nacimiento ? calcAge(mascota.fecha_nacimiento) : '—'}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sexo</span>
            <span className="text-sm font-semibold text-[var(--text-h)]">{mascota.sexo === 'M' ? 'Macho' : 'Hembra'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Castrado/a</span>
            <span className="text-sm font-semibold text-[var(--text-h)]">{mascota.es_castrado ? 'Sí' : 'No'}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Microchip</span>
            {mascota.numero_microchip ? (
              <span className="text-sm font-semibold text-[var(--text-h)] font-mono">{mascota.numero_microchip}</span>
            ) : (
              <span className="text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer font-mono" onClick={onEditClick}>
                + Agregar microchip
              </span>
            )}
          </div>
        </div>
      </Card>

      {mascota.propietarios && mascota.propietarios.length > 0 && (
        <Card className="p-5 border border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text-h)] mb-4">Propietarios</h3>
          <div className="flex flex-col gap-4">
            {mascota.propietarios.map((p) => (
              <div key={p.id} className="p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Nombre</span>
                    <span className="text-sm font-semibold text-[var(--text-h)]">
                      {p.nombre} {p.apellido} {p.razon_social ? `(${p.razon_social})` : ''}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Relación</span>
                    <div>
                      <Badge variant={p.activo ? 'success' : 'neutral'}>
                        {p.relacion} {p.activo ? '(Activo)' : '(Inactivo)'}
                      </Badge>
                    </div>
                  </div>
                  {p.telefono && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Teléfono</span>
                      {!isOwner ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--text-h)]">{p.telefono}</span>
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${p.telefono}`}
                              className="p-1 rounded-md bg-[var(--surface-solid)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-h)] transition"
                              title={`Llamar a ${p.nombre}`}
                            >
                              <Phone size={13} />
                            </a>
                            <a
                              href={formatWhatsAppLink(
                                p.telefono,
                                `Hola ${p.nombre}, te contacto desde VetVault en relación a tu mascota ${mascota.nombre}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-[var(--surface-solid)] border border-[var(--border)] text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition"
                              title={`Enviar WhatsApp a ${p.nombre}`}
                            >
                              <MessageCircle size={13} />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-[var(--text-h)]">{p.telefono}</span>
                      )}
                    </div>
                  )}
                  {p.direccion && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Dirección</span>
                      <span className="text-sm font-semibold text-[var(--text-h)]">{p.direccion}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isOwner && (contactVets.length > 0 || contactClinics.length > 0) && (
        <Card className="p-5 border border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text-h)] mb-1">Contactos de Atención</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Comunícate directamente con los profesionales o clínicas que atendieron a tu mascota.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {contactVets.map((vet: any) => (
              <div key={vet.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-2">
                  <span className="text-sm font-semibold text-[var(--text-h)] truncate">Dr. {vet.nombre} {vet.apellido}</span>
                  <span className="text-xs text-[var(--text-muted)] truncate">Médico Veterinario</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {vet.telefono && (
                    <>
                      <a
                        href={`tel:${vet.telefono}`}
                        className="p-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-h)] transition"
                        title={`Llamar a Dr. ${vet.nombre}`}
                      >
                        <Phone size={14} />
                      </a>
                      <a
                        href={formatWhatsAppLink(
                          vet.telefono,
                          `Hola Dr. ${vet.nombre}, le escribo por mi mascota ${mascota.nombre} mediante VetVault.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition"
                        title={`WhatsApp a Dr. ${vet.nombre}`}
                      >
                        <MessageCircle size={14} />
                      </a>
                    </>
                  )}
                  {vet.usuario?.email && (
                    <a
                      href={`mailto:${vet.usuario.email}?subject=Consulta sobre ${mascota.nombre}`}
                      className="p-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-h)] transition"
                      title={`Email a Dr. ${vet.nombre}`}
                    >
                      <Mail size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {contactClinics.map((clinic: any) => (
              <div key={clinic.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-2">
                  <span className="text-sm font-semibold text-[var(--text-h)] truncate">{clinic.nombre_comercial}</span>
                  <span className="text-xs text-[var(--text-muted)] truncate">{clinic.direccion || 'Clínica Veterinaria'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {clinic.telefono && (
                    <a
                      href={`tel:${clinic.telefono}`}
                      className="p-1.5 rounded-lg bg-[var(--surface-solid)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-h)] transition"
                      title={`Llamar a ${clinic.nombre_comercial}`}
                    >
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-5 border border-[var(--border)]">
        <h3 className="text-sm font-bold text-[var(--text-h)] mb-4">Evolución de Peso</h3>
        <WeightChart atenciones={atenciones} />
      </Card>

      {isOwner && (
        <Card className="p-5 border border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text-h)] mb-1">Código de Admisión</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Compartí este código o el código QR con tu veterinario para que pueda admitir a tu mascota como paciente.
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-sm inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mascota.id}`}
                alt="Código QR de Admisión"
                className="w-[150px] h-[150px] block"
              />
            </div>
            <div className="flex gap-2 w-full max-w-sm">
              <input
                type="text"
                readOnly
                value={mascota.id}
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs font-mono text-center text-[var(--text-h)] outline-none"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(mascota.id);
                  toast.success('Código copiado al portapapeles');
                }}
                size="sm"
              >
                Copiar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
