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
