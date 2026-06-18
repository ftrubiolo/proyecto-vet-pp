import type { TDocumentDefinitions } from 'pdfmake/interfaces';

function formatAge(birthDate: Date | string): string {
    const today = new Date();
    const birth = new Date(birthDate);
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
        years--;
        months += 12;
    }

    if (years === 0) {
        return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

function formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function parseBoldText(text: string): any[] {
    const parts = text.split('**');
    const nodes: any[] = [];
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '') continue;
        const isBold = i % 2 === 1;
        nodes.push({
            text: parts[i],
            bold: isBold
        });
    }
    return nodes;
}

function parseMarkdownToPdfmake(content: string): any[] {
    const lines = content.split('\n');
    const result: any[] = [];
    let currentList: any[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Headers
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headerMatch) {
            if (currentList.length > 0) {
                result.push({ ul: currentList, margin: [0, 5, 0, 10] });
                currentList = [];
            }
            const level = headerMatch[1].length;
            const textContent = parseBoldText(headerMatch[2]);
            const fontSize = level === 1 ? 16 : level === 2 ? 14 : 12;
            result.push({
                text: textContent,
                fontSize,
                bold: true,
                color: '#1e3a8a',
                margin: [0, 12, 0, 6]
            });
            continue;
        }

        // Bullet list items
        const listMatch = trimmed.match(/^[-*•]\s+(.*)$/);
        if (listMatch) {
            currentList.push({ text: parseBoldText(listMatch[1]) });
            continue;
        }

        // Empty line
        if (trimmed === '') {
            if (currentList.length > 0) {
                result.push({ ul: currentList, margin: [0, 5, 0, 10] });
                currentList = [];
            }
            continue;
        }

        // Regular paragraph
        if (currentList.length > 0) {
            result.push({ ul: currentList, margin: [0, 5, 0, 10] });
            currentList = [];
        }

        result.push({
            text: parseBoldText(trimmed),
            fontSize: 10,
            color: '#374151',
            margin: [0, 4, 0, 4]
        });
    }

    if (currentList.length > 0) {
        result.push({ ul: currentList, margin: [0, 5, 0, 10] });
    }

    return result;
}

export function buildAtencionReport(atencion: any): TDocumentDefinitions {
    const activeRel = atencion.mascota?.mascotas_propietarios?.find((rel: any) => rel.activo !== false);
    const propietario = activeRel?.propietario;

    const diagnosticosList = atencion.atenciones_diagnosticos && atencion.atenciones_diagnosticos.length > 0
        ? atencion.atenciones_diagnosticos.map((ad: any) => ({
            text: [
                { text: `${ad.diagnostico?.diagnostico || 'Diagnóstico'}: `, bold: true },
                { text: ad.diagnostico?.descripcion || '' }
            ],
            margin: [0, 2, 0, 2]
        }))
        : [{ text: 'No se registraron diagnósticos específicos.', italic: true, color: '#6b7280' }];

    const tratamientosList = atencion.tratamientos && atencion.tratamientos.length > 0
        ? atencion.tratamientos.map((t: any) => ({
            text: [
                { text: `${t.tipo_tratamiento?.tipo || 'Tratamiento'}: `, bold: true },
                { text: `${t.producto?.nombre_comercial || 'Medicamento'} — Dosis: ${t.dosis} | Frecuencia: ${t.frecuencia}` },
                t.indicaciones_adicionales ? { text: `\nIndicaciones: ${t.indicaciones_adicionales}`, italic: true, color: '#4b5563' } : ''
            ],
            margin: [0, 3, 0, 3]
        }))
        : [{ text: 'No se prescribieron tratamientos.', italic: true, color: '#6b7280' }];

    return {
        content: [
            // Header Clinic info
            {
                columns: [
                    {
                        text: atencion.clinica?.nombre_comercial || 'Clínica Veterinaria',
                        fontSize: 16,
                        bold: true,
                        color: '#1e3a8a'
                    },
                    {
                        text: [
                            { text: `Teléfono: ${atencion.clinica?.telefono || 'N/A'}\n` },
                            { text: `Dirección: ${atencion.clinica?.direccion || 'N/A'}` }
                        ],
                        alignment: 'right',
                        fontSize: 9,
                        color: '#4b5563'
                    }
                ]
            },
            { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 1, lineColor: '#e5e7eb' }] },

            // Title
            {
                text: 'RESUMEN DE ATENCIÓN CLÍNICA',
                fontSize: 18,
                bold: true,
                color: '#1e3a8a',
                alignment: 'center',
                margin: [0, 15, 0, 15]
            },

            // Metadata: Fecha y Veterinario
            {
                table: {
                    widths: ['50%', '50%'],
                    body: [
                        [
                            {
                                text: [
                                    { text: 'Fecha: ', bold: true },
                                    { text: formatDateTime(atencion.fecha_atencion) }
                                ],
                                fontSize: 10
                            },
                            {
                                text: [
                                    { text: 'Veterinario: ', bold: true },
                                    { text: `Dr. ${atencion.veterinario?.nombre || ''} ${atencion.veterinario?.apellido || ''} (${atencion.veterinario?.matricula || 'MP-N/A'})` }
                                ],
                                fontSize: 10,
                                alignment: 'right'
                            }
                        ]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 15]
            },

            // Patient and Owner Columns
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: 'PACIENTE', fontSize: 11, bold: true, color: '#1e3a8a', margin: [0, 0, 0, 5] },
                            { text: `Nombre: ${atencion.mascota?.nombre || 'N/A'}`, fontSize: 10 },
                            { text: `Especie: ${atencion.mascota?.raza?.especie?.especie || 'N/A'}`, fontSize: 10 },
                            { text: `Raza: ${atencion.mascota?.raza?.raza || 'N/A'}`, fontSize: 10 },
                            { text: `Edad: ${atencion.mascota?.fecha_nacimiento ? formatAge(atencion.mascota.fecha_nacimiento) : 'N/A'}`, fontSize: 10 },
                            { text: `Peso actual: ${atencion.peso_actual ? `${atencion.peso_actual} kg` : 'No registrado'}`, fontSize: 10 },
                        ]
                    },
                    {
                        width: '50%',
                        stack: [
                            { text: 'PROPIETARIO', fontSize: 11, bold: true, color: '#1e3a8a', margin: [0, 0, 0, 5] },
                            { text: `Nombre: ${propietario ? `${propietario.nombre} ${propietario.apellido}` : 'N/A'}`, fontSize: 10 },
                            { text: `Teléfono: ${propietario?.telefono || 'N/A'}`, fontSize: 10 },
                            { text: `Dirección: ${propietario?.direccion || 'N/A'}`, fontSize: 10 },
                        ]
                    }
                ],
                margin: [0, 0, 0, 20]
            },

            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }] },

            // Diagnostics Section
            { text: 'DIAGNÓSTICOS', fontSize: 12, bold: true, color: '#1e3a8a', margin: [0, 15, 0, 5] },
            { stack: diagnosticosList, fontSize: 10, margin: [5, 0, 0, 15] },

            // Treatments Section
            { text: 'TRATAMIENTOS PRESCRIPTOS', fontSize: 12, bold: true, color: '#1e3a8a', margin: [0, 5, 0, 5] },
            { stack: tratamientosList, fontSize: 10, margin: [5, 0, 0, 15] },

            // Clinical Notes Section
            { text: 'NOTAS CLÍNICAS', fontSize: 12, bold: true, color: '#1e3a8a', margin: [0, 5, 0, 5] },
            {
                text: atencion.notas_clinicas || 'Sin notas adicionales.',
                fontSize: 10,
                color: '#374151',
                margin: [5, 0, 0, 15],
                alignment: 'justify'
            },

            // Footer / Generation Stamp
            {
                text: `Documento generado el ${formatDateTime(new Date())} - VetVault © 2026`,
                fontSize: 8,
                color: '#9ca3af',
                alignment: 'center',
                margin: [0, 30, 0, 0]
            }
        ],
        defaultStyle: {
            font: 'Roboto'
        }
    };
}

export function buildTratamientoReport(tratamiento: any): TDocumentDefinitions {
    const atencion = tratamiento.atencion || {};
    const activeRel = atencion.mascota?.mascotas_propietarios?.find((rel: any) => rel.activo !== false);
    const propietario = activeRel?.propietario;

    return {
        content: [
            // Header Clinic info
            {
                columns: [
                    {
                        text: atencion.clinica?.nombre_comercial || 'Clínica Veterinaria',
                        fontSize: 16,
                        bold: true,
                        color: '#1e3a8a'
                    },
                    {
                        text: [
                            { text: `Teléfono: ${atencion.clinica?.telefono || 'N/A'}\n` },
                            { text: `Dirección: ${atencion.clinica?.direccion || 'N/A'}` }
                        ],
                        alignment: 'right',
                        fontSize: 9,
                        color: '#4b5563'
                    }
                ]
            },
            { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 1, lineColor: '#e5e7eb' }] },

            // Title
            {
                text: 'PRESCRIPCIÓN DE TRATAMIENTO',
                fontSize: 18,
                bold: true,
                color: '#1e3a8a',
                alignment: 'center',
                margin: [0, 15, 0, 15]
            },

            // Metadata: Fecha y Veterinario
            {
                table: {
                    widths: ['50%', '50%'],
                    body: [
                        [
                            {
                                text: [
                                    { text: 'Fecha Inicio: ', bold: true },
                                    { text: formatDate(tratamiento.fecha_inicio) }
                                ],
                                fontSize: 10
                            },
                            {
                                text: [
                                    { text: 'Veterinario: ', bold: true },
                                    { text: `Dr. ${atencion.veterinario?.nombre || ''} ${atencion.veterinario?.apellido || ''} (${atencion.veterinario?.matricula || 'MP-N/A'})` }
                                ],
                                fontSize: 10,
                                alignment: 'right'
                            }
                        ]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 0, 0, 15]
            },

            // Patient and Owner Columns
            {
                columns: [
                    {
                        width: '50%',
                        stack: [
                            { text: 'PACIENTE', fontSize: 11, bold: true, color: '#1e3a8a', margin: [0, 0, 0, 5] },
                            { text: `Nombre: ${atencion.mascota?.nombre || 'N/A'}`, fontSize: 10 },
                            { text: `Especie: ${atencion.mascota?.raza?.especie?.especie || 'N/A'}`, fontSize: 10 },
                            { text: `Raza: ${atencion.mascota?.raza?.raza || 'N/A'}`, fontSize: 10 },
                        ]
                    },
                    {
                        width: '50%',
                        stack: [
                            { text: 'PROPIETARIO', fontSize: 11, bold: true, color: '#1e3a8a', margin: [0, 0, 0, 5] },
                            { text: `Nombre: ${propietario ? `${propietario.nombre} ${propietario.apellido}` : 'N/A'}`, fontSize: 10 },
                            { text: `Teléfono: ${propietario?.telefono || 'N/A'}`, fontSize: 10 },
                        ]
                    }
                ],
                margin: [0, 0, 0, 20]
            },

            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }] },

            // Treatment Details
            { text: 'DETALLES DE LA PRESCRIPCIÓN', fontSize: 12, bold: true, color: '#1e3a8a', margin: [0, 15, 0, 10] },

            {
                table: {
                    widths: ['35%', '65%'],
                    body: [
                        [
                            { text: 'Tipo de Tratamiento:', bold: true, fillColor: '#f9fafb' },
                            { text: tratamiento.tipo_tratamiento?.tipo || 'Tratamiento' }
                        ],
                        [
                            { text: 'Producto/Medicamento:', bold: true, fillColor: '#f9fafb' },
                            { text: tratamiento.producto?.nombre_comercial || 'Medicamento' }
                        ],
                        [
                            { text: 'Dosis Prescripta:', bold: true, fillColor: '#f9fafb' },
                            { text: tratamiento.dosis || 'N/A' }
                        ],
                        [
                            { text: 'Frecuencia:', bold: true, fillColor: '#f9fafb' },
                            { text: tratamiento.frecuencia || 'N/A' }
                        ],
                        [
                            { text: 'Período:', bold: true, fillColor: '#f9fafb' },
                            {
                                text: `Desde ${formatDate(tratamiento.fecha_inicio)} ${
                                    tratamiento.fecha_fin ? `hasta ${formatDate(tratamiento.fecha_fin)}` : '(Indefinido)'
                                }`
                            }
                        ]
                    ]
                },
                fontSize: 10,
                margin: [0, 0, 0, 15]
            },

            // Indications
            { text: 'INDICACIONES ADICIONALES', fontSize: 12, bold: true, color: '#1e3a8a', margin: [0, 10, 0, 5] },
            {
                text: tratamiento.indicaciones_adicionales || 'No se registraron indicaciones adicionales.',
                fontSize: 10,
                color: '#374151',
                margin: [5, 0, 0, 20]
            },

            // Footer / Generation Stamp
            {
                text: `Documento generado el ${formatDateTime(new Date())} - VetVault © 2026`,
                fontSize: 8,
                color: '#9ca3af',
                alignment: 'center',
                margin: [0, 30, 0, 0]
            }
        ],
        defaultStyle: {
            font: 'Roboto'
        }
    };
}

export function buildAIChatReport(title: string, content: string): TDocumentDefinitions {
    const parsedBlocks = parseMarkdownToPdfmake(content);

    return {
        content: [
            // Header Clinic info
            {
                columns: [
                    {
                        text: 'VetVault — Asistente IA',
                        fontSize: 14,
                        bold: true,
                        color: '#1e3a8a'
                    },
                    {
                        text: `Fecha: ${formatDateTime(new Date())}`,
                        alignment: 'right',
                        fontSize: 9,
                        color: '#4b5563'
                    }
                ]
            },
            { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 1, lineColor: '#e5e7eb' }] },

            // Title
            {
                text: title.toUpperCase() || 'RESPUESTA DE CONSULTA IA',
                fontSize: 16,
                bold: true,
                color: '#1e3a8a',
                alignment: 'center',
                margin: [0, 15, 0, 15]
            },

            // AI Blocks
            ...parsedBlocks,

            // Footer / Generation Stamp
            {
                text: 'Este reporte fue generado por la Inteligencia Artificial de VetVault y es para uso informativo clínico.',
                fontSize: 8,
                color: '#9ca3af',
                alignment: 'center',
                margin: [0, 30, 0, 0],
                italics: true
            }
        ],
        defaultStyle: {
            font: 'Roboto'
        }
    };
}
