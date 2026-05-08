// ═══════════════════════════════════════════════
//  BACKEND API CONFIGURATION
//
//  Replace the BASE_URL below with your backend
//  host link when ready.
// ═══════════════════════════════════════════════

export const API_BASE_URL = "http://127.0.0.1:8000";

export const ENDPOINTS = {
  chat:    `${API_BASE_URL}/chat`,
  history: `${API_BASE_URL}/history`,
  researchGenerate: `${API_BASE_URL}/api/research/generate`,
  researchSection: `${API_BASE_URL}/api/research/section`,
  researchExport: `${API_BASE_URL}/api/research/export`,
  apod:    `${API_BASE_URL}/api/explorer/apod`,
  nasaGallery: `${API_BASE_URL}/api/explorer/gallery`,
  spaceNews: `${API_BASE_URL}/api/explorer/news`,
};
