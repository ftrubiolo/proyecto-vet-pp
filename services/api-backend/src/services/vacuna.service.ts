import { db } from "../db";
import { eq } from "drizzle-orm";
import { vacunas } from "../db/schema";

export class VacunaService {
    static async getByMascotaId(mascotaId: string): Promise<any[]> {
        return await db.query.vacunas.findMany({
            where: eq(vacunas.mascota_id, mascotaId),
            with: {
                producto: true
            }
        }) as any[];
    }
}
