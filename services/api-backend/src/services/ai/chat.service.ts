import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TokenPayload } from "@vetvault/shared";
import { buildClinicalContext, buildGeneralContext } from "./context";
import { getSystemPrompt } from "./prompts";
import { runChatSession } from "./session";
import type { ChatMessage } from "./types";

const MODEL_NAME = "gemini-3.1-flash-lite";

export class AiChatService {
    static async processMessage(
        user: TokenPayload,
        message: string,
        history: ChatMessage[],
        context?: { activeMascotaId?: string }
    ): Promise<string> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("La API Key de Gemini no está configurada en el servidor");
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

        const genAI = new GoogleGenerativeAI(apiKey);
        return runChatSession(genAI, MODEL_NAME, systemInstruction, message, history, user);
    }
}
