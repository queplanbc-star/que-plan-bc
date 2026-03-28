import { GoogleGenAI } from "@google/genai";
import { CulturalEvent } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("API Key not found in environment variables.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const generateEventRecommendations = async (
    userQuery: string, 
    availableEvents: CulturalEvent[]
): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Lo siento, no puedo conectar con el asistente en este momento. Por favor verifica la configuración de la API Key.";

    // Simplify event data for the prompt to save tokens
    const eventsContext = availableEvents.map(e => 
        `- ${e.title} (${e.category}): ${e.date} a las ${e.time}. ${e.description || ''}`
    ).join('\n');

    const systemInstruction = `
        Eres un asistente experto en cultura y turismo local para la aplicación "Qué Plan".
        Tu objetivo es ayudar a los usuarios a encontrar eventos basándote en su consulta.
        
        Aquí tienes la lista actual de eventos disponibles en la base de datos:
        ${eventsContext}

        Reglas:
        1. Solo recomienda eventos que estén en la lista proporcionada.
        2. Si la consulta del usuario es vaga (ej. "quiero algo tranquilo"), infiere la mejor opción basada en la categoría y descripción.
        3. Sé breve, entusiasta y amigable.
        4. Si no hay eventos que coincidan, sugiérele que revise otras fechas.
        5. Responde siempre en español.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-latest',
            contents: userQuery,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        
        return response.text || "No pude generar una respuesta.";
    } catch (error) {
        console.error("Error calling Gemini:", error);
        return "Hubo un error al procesar tu solicitud. Intenta de nuevo más tarde.";
    }
};

export const generateEventDescription = async (title: string, category: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Descripción no disponible.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-latest',
            contents: `Escribe una descripción corta (máximo 150 caracteres), atractiva y emocionante para un evento cultural llamado "${title}" de la categoría "${category}".`,
        });
        return response.text?.replace(/['"]/g, '') || "";
    } catch (error) {
        return "Descripción pendiente.";
    }
}
