import { ENDPOINTS } from "./config";

/**
 * Send a message to the agent backend.
 * TODO: Connect to real backend — currently returns a mock response.
 *
 * @param {string} message - The user's query
 * @returns {Promise<{reply: string}>}
 */
export async function sendMessage(message) {
    try {
        const response = await fetch(ENDPOINTS.chat, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        return data;
    } catch (error) {
        console.warn("Backend not connected, returning mock response:", error.message);

        // Mock response when backend is not available
        return {
            reply: `🛰️ Transmission received! Your query "${message.slice(0, 50)}..." has been logged. Connect a backend to get real responses.`,
        };
    }
}

/**
 * Fetch chat history from the backend.
 * TODO: Connect to real backend — currently returns empty array.
 *
 * @returns {Promise<Array>}
 */
export async function getHistory() {
    try {
        const response = await fetch(ENDPOINTS.history);

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        return data;
    } catch (error) {
        console.warn("Backend not connected, returning empty history:", error.message);
        return [];
    }
}
