export interface ChatMessage {
    sender: "user" | "ai";
    text: string;
}

export interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    context?: {
        activeMascotaId?: string;
    };
}

export interface OpenAIMessage {
    role: "system" | "user" | "assistant" | "tool";
    content?: string | null;
    tool_calls?: {
        id: string;
        type: "function";
        function: {
            name: string;
            arguments: string;
        };
    }[];
    tool_call_id?: string;
    name?: string;
}

export interface OpenAITool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, unknown>;
            required?: string[];
        };
    };
}
