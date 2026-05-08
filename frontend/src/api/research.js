import { ENDPOINTS } from './config';

async function readJsonResponse(response, fallbackMessage) {
    if (!response.ok) {
        let detail = fallbackMessage;
        try {
            const payload = await response.json();
            detail = payload?.detail || payload?.message || payload?.error || fallbackMessage;
        } catch {
            // Ignore JSON parse issues and use the fallback message.
        }
        throw new Error(detail);
    }

    return response.json();
}

export async function generateResearchPaper(payload) {
    const response = await fetch(ENDPOINTS.researchGenerate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return readJsonResponse(response, 'Research paper generation failed.');
}

export async function generateResearchSection(payload) {
    const response = await fetch(ENDPOINTS.researchSection, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return readJsonResponse(response, 'Research section generation failed.');
}

export async function exportResearchPaper(payload) {
    const response = await fetch(ENDPOINTS.researchExport, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return readJsonResponse(response, 'Research paper export failed.');
}