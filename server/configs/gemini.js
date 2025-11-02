// configs/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client with API key
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default ai;