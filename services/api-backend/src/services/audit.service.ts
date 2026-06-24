import { db } from "../db";
import { audit_log } from "../db/schema";

export class AuditService {
    static async log(userId: string, userRol: string, tool: string, args: Record<string, unknown>): Promise<void> {
        try {
            await db.insert(audit_log).values({
                user_id: userId,
                user_rol: userRol,
                tool,
                args: args as any,
            });
        } catch (err) {
            console.error("AuditService: error al insertar audit_log", err);
        }
    }
}
