import type { TokenPayload } from "@vetvault/shared";
import { getOpenAITools, findTool } from "./tools";
import { AuditService } from "../audit.service";
import type { ChatMessage, OpenAIMessage } from "./types";

const MAX_FUNCTION_CALLS: Record<string, number> = {
    Veterinario: 8,
    Propietario: 4,
    Admin: 8,
};

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

async function postChatCompletion(apiKey: string, payload: unknown): Promise<any> {
    const response = await fetch(OPENROUTER_ENDPOINT, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://vetvault.app",
            "X-Title": "VetVault Copilot",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del proveedor de IA (${response.status}): ${errorText}`);
    }

    return response.json();
}

export async function runChatSession(
    apiKey: string,
    modelName: string,
    systemInstruction: string,
    message: string,
    history: ChatMessage[],
    user: TokenPayload
): Promise<string> {
    const messages: OpenAIMessage[] = [
        { role: "system", content: systemInstruction },
        ...history.map(msg => ({
            role: (msg.sender === "user" ? "user" : "assistant") as "user" | "assistant",
            content: msg.text,
        })),
        { role: "user", content: message },
    ];

    const openAITools = getOpenAITools();
    let limit = MAX_FUNCTION_CALLS[user.rol] ?? 5;

    while (limit > 0) {
        const data = await postChatCompletion(apiKey, {
            model: modelName,
            messages,
            tools: openAITools,
        });

        const choice = data.choices?.[0];
        if (!choice || !choice.message) {
            throw new Error("Respuesta inválida recibida del proveedor de IA.");
        }

        const assistantMsg = choice.message;
        const toolCalls = assistantMsg.tool_calls;

        if (!toolCalls || toolCalls.length === 0) {
            return assistantMsg.content || "";
        }

        messages.push({
            role: "assistant",
            content: assistantMsg.content ?? null,
            tool_calls: toolCalls,
        });

        limit--;

        for (const call of toolCalls) {
            const toolName = call.function.name;
            let args: Record<string, unknown> = {};
            try {
                args = JSON.parse(call.function.arguments || "{}");
            } catch {
                args = {};
            }

            const tool = findTool(toolName);
            let functionResult: object;
            if (!tool) {
                functionResult = { error: "Función no reconocida o no implementada." };
            } else {
                AuditService.log(user.id, user.rol, toolName, args);
                try {
                    functionResult = await tool.handler(args, user);
                } catch (err) {
                    functionResult = {
                        error: err instanceof Error ? err.message : "Error inesperado ejecutando la función."
                    };
                }
            }

            messages.push({
                role: "tool",
                tool_call_id: call.id,
                name: toolName,
                content: JSON.stringify(functionResult),
            });
        }
    }

    const finalData = await postChatCompletion(apiKey, {
        model: modelName,
        messages,
    });

    return finalData.choices?.[0]?.message?.content || "";
}
