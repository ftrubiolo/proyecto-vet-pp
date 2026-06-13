import { Phone, Mail, MessageCircle, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { WeightChart } from './WeightChart';
import { formatDate, calcAge } from '../utils';
import type { MascotaDetail } from '../types';

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
  onEditClick?: () => void;
}

export function DatosTab({ mascota, isOwner, atenciones, onEditClick }: DatosTabProps) {
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
        <span className="alerts-value-empty" onClick={onEditClick}>
          <Plus size={12} /> Registrar Alergia
        </span>
      ) : (
        <span className="alerts-value text-muted">Sin registrar</span>
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
        <span className="alerts-value-empty" onClick={onEditClick}>
          <Plus size={12} /> Registrar Condición
        </span>
      ) : (
        <span className="alerts-value text-muted">Sin registrar</span>
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
        <span className="alerts-value-empty" onClick={onEditClick}>
          <Plus size={12} /> Registrar Contraindicación
        </span>
      ) : (
        <span className="alerts-value text-muted">Sin registrar</span>
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
    <div>
      <Card className={`clinical-alerts-card ${hasActiveAlerts ? 'has-active-alerts' : 'no-alerts'}`}>
        <h3 className="datos-tab-heading">Alertas Clínicas y Seguridad</h3>
        <div className="alerts-content-grid">
          <div className="alerts-item">
            <span className="alerts-label">Alergias Conocidas</span>
            {renderAllergies()}
          </div>

          <div className="alerts-item">
            <span className="alerts-label">Condiciones Crónicas</span>
            {renderChronicConditions()}
          </div>

          <div className="alerts-item">
            <span className="alerts-label">Contraindicaciones</span>
            {renderContraindications()}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="datos-tab-heading">Información General</h3>
        <div className="mascota-datos-grid">
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Nombre</span>
            <span className="mascota-dato-value">{mascota.nombre}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Especie</span>
            {mascota.especie ? (
              <span className="mascota-dato-value">{mascota.especie}</span>
            ) : (
              <span className="mascota-dato-agregar" onClick={onEditClick}>
                + Agregar Especie
              </span>
            )}
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Raza</span>
            {mascota.raza ? (
              <span className="mascota-dato-value">{mascota.raza}</span>
            ) : (
              <span className="mascota-dato-agregar" onClick={onEditClick}>
                + Agregar Raza
              </span>
            )}
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Fecha de Nacimiento</span>
            {mascota.fecha_nacimiento ? (
              <span className="mascota-dato-value">{formatDate(mascota.fecha_nacimiento)}</span>
            ) : (
              <span className="mascota-dato-agregar" onClick={onEditClick}>
                + Agregar Fecha de Nacimiento
              </span>
            )}
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Edad</span>
            <span className="mascota-dato-value">
              {mascota.fecha_nacimiento ? calcAge(mascota.fecha_nacimiento) : '—'}
            </span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Sexo</span>
            <span className="mascota-dato-value">{mascota.sexo === 'M' ? 'Macho' : 'Hembra'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Castrado/a</span>
            <span className="mascota-dato-value">{mascota.es_castrado ? 'Sí' : 'No'}</span>
          </div>
          <div className="mascota-dato-item">
            <span className="mascota-dato-label">Microchip</span>
            {mascota.numero_microchip ? (
              <span className="mascota-dato-value font-mono">{mascota.numero_microchip}</span>
            ) : (
              <span className="mascota-dato-agregar font-mono" onClick={onEditClick}>
                + Agregar microchip
              </span>
            )}
          </div>
        </div>
      </Card>

      {mascota.propietarios && mascota.propietarios.length > 0 && (
        <Card style={{ marginTop: 'var(--space-md)' }}>
          <h3 className="datos-tab-heading">Propietarios</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {mascota.propietarios.map((p) => (
              <div key={p.id} className="propietario-item-detail">
                <div className="mascota-datos-grid">
                  <div className="mascota-dato-item">
                    <span className="mascota-dato-label">Nombre</span>
                    <span className="mascota-dato-value">
                      {p.nombre} {p.apellido} {p.razon_social ? `(${p.razon_social})` : ''}
                    </span>
                  </div>
                  <div className="mascota-dato-item">
                    <span className="mascota-dato-label">Relación</span>
                    <span className="mascota-dato-value">
                      <Badge variant={p.activo ? 'success' : 'neutral'}>
                        {p.relacion} {p.activo ? '(Activo)' : '(Inactivo)'}
                      </Badge>
                    </span>
                  </div>
                  {p.telefono && (
                    <div className="mascota-dato-item">
                      <span className="mascota-dato-label">Teléfono</span>
                      {!isOwner ? (
                        <div className="contact-action-wrapper">
                          <span className="mascota-dato-value">{p.telefono}</span>
                          <div className="contact-buttons-group">
                            <a
                              href={`tel:${p.telefono}`}
                              className="contact-btn phone-btn"
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
                              className="contact-btn whatsapp-btn"
                              title={`Enviar WhatsApp a ${p.nombre}`}
                            >
                              <MessageCircle size={13} />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <span className="mascota-dato-value">{p.telefono}</span>
                      )}
                    </div>
                  )}
                  {p.direccion && (
                    <div className="mascota-dato-item">
                      <span className="mascota-dato-label">Dirección</span>
                      <span className="mascota-dato-value">{p.direccion}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {isOwner && (contactVets.length > 0 || contactClinics.length > 0) && (
        <Card style={{ marginTop: 'var(--space-md)' }}>
          <h3 className="datos-tab-heading">Contactos de Atención</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Comunícate directamente con los profesionales o clínicas que atendieron a tu mascota.
          </p>

          <div className="vet-contacts-grid">
            {contactVets.map((vet: any) => (
              <div key={vet.id} className="vet-contact-card">
                <div className="vet-contact-info">
                  <span className="vet-contact-name">Dr. {vet.nombre} {vet.apellido}</span>
                  <span className="vet-contact-sub">Médico Veterinario</span>
                </div>
                <div className="vet-contact-actions">
                  {vet.telefono && (
                    <>
                      <a
                        href={`tel:${vet.telefono}`}
                        className="contact-icon-link phone"
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
                        className="contact-icon-link whatsapp"
                        title={`WhatsApp a Dr. ${vet.nombre}`}
                      >
                        <MessageCircle size={14} />
                      </a>
                    </>
                  )}
                  {vet.usuario?.email && (
                    <a
                      href={`mailto:${vet.usuario.email}?subject=Consulta sobre ${mascota.nombre}`}
                      className="contact-icon-link email"
                      title={`Email a Dr. ${vet.nombre}`}
                    >
                      <Mail size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}

            {contactClinics.map((clinic: any) => (
              <div key={clinic.id} className="vet-contact-card clinic">
                <div className="vet-contact-info">
                  <span className="vet-contact-name">{clinic.nombre_comercial}</span>
                  <span className="vet-contact-sub">{clinic.direccion || 'Clínica Veterinaria'}</span>
                </div>
                <div className="vet-contact-actions">
                  {clinic.telefono && (
                    <a
                      href={`tel:${clinic.telefono}`}
                      className="contact-icon-link phone"
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

      <Card className="weight-graph-card">
        <div className="weight-graph-header">
          <h3 className="datos-tab-heading" style={{ margin: 0 }}>Evolución de Peso</h3>
        </div>
        <WeightChart atenciones={atenciones} />
      </Card>

      {isOwner && (
        <Card style={{ marginTop: 'var(--space-md)' }}>
          <h3 className="datos-tab-heading">Código de Admisión</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
            Compartí este código o el código QR con tu veterinario para que pueda admitir a tu mascota como paciente.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              background: '#fff',
              padding: '12px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              display: 'inline-block'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mascota.id}`}
                alt="Código QR de Admisión"
                style={{ width: 150, height: 150, display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 350 }}>
              <input
                type="text"
                readOnly
                value={mascota.id}
                style={{
                  flex: 1,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  color: 'var(--text-color)'
                }}
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(mascota.id);
                  alert('Código copiado al portapapeles');
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
