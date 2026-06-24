import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TokenPayload } from "@vetvault/shared";
import { getToolDeclarations, findTool } from "./tools";
import { AuditService } from "../audit.service";
import type { ChatMessage } from "./types";

const MAX_FUNCTION_CALLS: Record<string, number> = {
    Veterinario: 8,
    Propietario: 4,
    Admin: 8,
};

export async function runChatSession(
    genAI: GoogleGenerativeAI,
    modelName: string,
    systemInstruction: string,
    message: string,
    history: ChatMessage[],
    user: TokenPayload
): Promise<string> {
    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        tools: [{ functionDeclarations: getToolDeclarations() }]
    });

    const chatSession = model.startChat({
        history: history.map(msg => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
        }))
    });

    let result = await chatSession.sendMessage(message);
    let limit = MAX_FUNCTION_CALLS[user.rol] ?? 5;
    let calls = result.response.functionCalls();

    while (calls && calls.length > 0 && limit > 0) {
        limit--;
        const call = calls[0];
        const tool = findTool(call.name);

        let functionResult: object;
        if (!tool) {
            functionResult = { error: "Función no reconocida o no implementada." };
        } else {
            AuditService.log(user.id, user.rol, call.name, call.args as Record<string, unknown>);
            try {
                functionResult = await tool.handler(call.args as Record<string, unknown>, user);
            } catch (err) {
                functionResult = { error: err instanceof Error ? err.message : "Error inesperado ejecutando la función." };
            }
        }

        result = await chatSession.sendMessage([{
            functionResponse: {
                name: call.name,
                response: functionResult
            }
        }]);
        calls = result.response.functionCalls();
    }

    return result.response.text();
}
