import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API, timeout: 120000 });

export const uploadDocument = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const listDocuments = async () => (await api.get("/documents")).data;
export const getDocument = async (id) => (await api.get(`/documents/${id}`)).data;
export const deleteDocument = async (id) => (await api.delete(`/documents/${id}`)).data;

export const askQuestion = async (id, question) =>
  (await api.post(`/documents/${id}/query`, { question })).data;

export const getHistory = async (id) => (await api.get(`/documents/${id}/history`)).data;

export const analyzeRisks = async (id) =>
  (await api.post(`/documents/${id}/analyze/risks`)).data;
export const analyzeClauses = async (id) =>
  (await api.post(`/documents/${id}/analyze/clauses`)).data;
export const analyzeSummary = async (id) =>
  (await api.post(`/documents/${id}/analyze/summary`)).data;

export const compareDocuments = async (doc1_id, doc2_id, aspect) =>
  (await api.post(`/documents/compare`, { doc1_id, doc2_id, aspect })).data;

export const reportUrl = (id) => `${API}/documents/${id}/report`;
