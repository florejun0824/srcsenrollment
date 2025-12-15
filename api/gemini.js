// api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  maxDuration: 60,
};

const getApiKeyPool = () => {
  const keys = new Set();
  if (process.env.GEMINI_API_KEY) keys.add(process.env.GEMINI_API_KEY);
  if (process.env.GEMINI_FALLBACK_API_KEY) keys.add(process.env.GEMINI_FALLBACK_API_KEY);
  if (process.env.VITE_GEMINI_API_KEY) keys.add(process.env.VITE_GEMINI_API_KEY);
  return Array.from(keys).filter(k => k && k.length > 10);
};

const API_KEYS = getApiKeyPool();

const getRandomKey = () => {
  if (API_KEYS.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * API_KEYS.length);
  return API_KEYS[randomIndex];
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    // We expect 'prompt' to be a simple string now, not an array of images
    const { prompt, model: requestedModel } = body;

    const apiKey = getRandomKey();
    if (!apiKey) throw new Error("No valid API Keys found.");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Strict adherence to requested model (Gemma)
    const modelName = requestedModel || 'gemma-3-27b-it';
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
}