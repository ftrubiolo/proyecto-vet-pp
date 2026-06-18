import pdfMake from '../pdf/printer';
import { buildAtencionReport, buildTratamientoReport, buildAIChatReport } from '../pdf/templates';

export class PdfService {
    /**
     * Genera el PDF de una atención.
     */
    static async generateAtencionPdf(atencion: any): Promise<Buffer> {
        const docDef = buildAtencionReport(atencion);
        const doc = pdfMake.createPdf(docDef);
        return await doc.getBuffer();
    }

    /**
     * Genera el PDF de un tratamiento.
     */
    static async generateTratamientoPdf(tratamiento: any): Promise<Buffer> {
        const docDef = buildTratamientoReport(tratamiento);
        const doc = pdfMake.createPdf(docDef);
        return await doc.getBuffer();
    }

    /**
     * Genera el PDF a partir del chat de IA.
     */
    static async generateAIChatPdf(title: string, content: string): Promise<Buffer> {
        const docDef = buildAIChatReport(title, content);
        const doc = pdfMake.createPdf(docDef);
        return await doc.getBuffer();
    }
}
