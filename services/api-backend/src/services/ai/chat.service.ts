import type { TokenPayload } from "@vetvault/shared";
import { buildClinicalContext, buildGeneralContext } from "./context";
import { getSystemPrompt } from "./prompts";
import { runChatSession } from "./session";
import type { ChatMessage } from "./types";

const MODEL_NAME = process.env.OPENROUTER_MODEL || "z-ai/glm-5.3-flash";

export class AiChatService {
    static async processMessage(
        user: TokenPayload,
        message: string,
        history: ChatMessage[],
        context?: { activeMascotaId?: string }
    ): Promise<string> {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error("La API Key de OpenRouter no está configurada en el servidor");
        }

        let clinicalContext: string | undefined;
        let generalContext: string | undefined;

        if (context?.activeMascotaId) {
            clinicalContext = await buildClinicalContext(context.activeMascotaId);
        } else {
            generalContext = await buildGeneralContext(user);
        }

        const systemInstruction = getSystemPrompt(
            user.rol,
            context?.activeMascotaId,
            clinicalContext,
            generalContext
        );

        return runChatSession(apiKey, MODEL_NAME, systemInstruction, message, history, user);
    }
}
