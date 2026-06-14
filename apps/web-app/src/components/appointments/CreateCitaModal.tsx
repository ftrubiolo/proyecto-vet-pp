import React, { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { api } from '../../api/client';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import './CreateCitaModal.css';

export interface CreateCitaModalProps {
  onClose: () => void;
  onCreate: () => void;
}

export function CreateCitaModal({ onClose, onCreate }: CreateCitaModalProps) {
  const [mascotaId, setMascotaId] = useState('');
  const [veterinarioId, setVeterinarioId] = useState('');
  const [clinicaId, setClinicaId] = useState('');
  const [motivoId, setMotivoId] = useState('1'); // Default: Consulta General
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  // Fetch dropdown lists
  const { data: mascotas } = useFetch<any[]>('/mascotas');
  
  // Only fetch clinics where the selected pet is a patient (Activo)
  const { data: clinicas } = useFetch<any[]>(
    mascotaId ? `/clinicas/mascota/${mascotaId}` : null
  );

  // Only fetch veterinarians associated with the selected clinic
  const { data: veterinarios } = useFetch<any[]>(
    clinicaId ? `/veterinarios/clinica/${clinicaId}` : null
  );

  // Pre-fill lists
  const mascotaList = Array.isArray(mascotas) ? mascotas : [];
  const vetList = Array.isArray(veterinarios) ? veterinarios : [];
  const clinicaList = Array.isArray(clinicas) ? clinicas : [];

  const handleMascotaChange = (id: string) => {
    setMascotaId(id);
    setClinicaId('');
    setVeterinarioId('');
  };

  const handleClinicaChange = (id: string) => {
    setClinicaId(id);
    setVeterinarioId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fechaHora = new Date(`${fecha}T${hora}`);

    try {
      await api.post('/citas', {
        mascota_id: mascotaId,
        veterinario_id: veterinarioId || null,
        clinica_id: clinicaId,
        fecha_hora: fechaHora.toISOString(),
        motivo_id: Number(motivoId),
        estado_cita_id: 1, // Agendada (Pendiente)
      });
      onCreate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al agendar cita');
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Agendar Nueva Cita"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="create-cita-form">Agendar</Button>
        </>
      }
    >
      <form id="create-cita-form" className="create-cita-form" onSubmit={handleSubmit}>
        <Select
          label="Mascota"
          options={[
            { value: '', label: 'Seleccionar mascota...' },
            ...mascotaList.map((m: any) => ({ value: m.id, label: m.nombre }))
          ]}
          value={mascotaId}
          onChange={(e) => handleMascotaChange(e.target.value)}
          required
        />
        
        <Select
          label="Clínica"
          options={[
            { value: '', label: mascotaId ? 'Seleccionar clínica...' : 'Seleccione una mascota primero...' },
            ...clinicaList.map((c: any) => ({ value: c.id, label: c.nombre_comercial }))
          ]}
          value={clinicaId}
          onChange={(e) => handleClinicaChange(e.target.value)}
          disabled={!mascotaId}
          required
        />

        <Select
          label="Veterinario"
          options={[
            { value: '', label: clinicaId ? 'Cualquiera / Sin asignar' : 'Seleccione una clínica primero...' },
            ...vetList.map((v: any) => ({ value: v.id, label: `${v.nombre} ${v.apellido}` }))
          ]}
          value={veterinarioId}
          onChange={(e) => setVeterinarioId(e.target.value)}
          disabled={!clinicaId}
        />

        <Select
          label="Motivo"
          options={[
            { value: '1', label: 'Consulta General' },
            { value: '2', label: 'Vacunación' },
            { value: '3', label: 'Cirugía' },
            { value: '4', label: 'Urgencia' },
          ]}
          value={motivoId}
          onChange={(e) => setMotivoId(e.target.value)}
          required
        />

        <div className="form-row">
          <Input
            label="Fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
          <Input
            label="Hora"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
