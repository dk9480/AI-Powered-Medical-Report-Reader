import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import Groq from 'groq-sdk';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import fetch from 'node-fetch';

// Import the prompt from our new, separate file
import { summarizeSystemPrompt } from './prompts/summarizePrompt.js';

const app = express();
const port = process.env.PORT || 5001;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Multer Setup ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Groq API Setup ---
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com'
});

if (!process.env.GROQ_API_KEY) {
  console.error("FATAL ERROR: GROQ_API_KEY is not defined in the .env file.");
  process.exit(1);
}
if (!process.env.HF_API_KEY) {
    console.error("FATAL ERROR: HF_API_KEY is not defined for image validation.");
    process.exit(1);
}

// --- Image Validation Function ---
const validateImageIsReport = async (imageBuffer) => {
    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/dandelin/vilt-b32-finetuned-vqa",
            {
                headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` },
                method: "POST",
                body: JSON.stringify({
                    inputs: {
                        question: "Is this an image of a text document?",
                        image: imageBuffer.toString('base64'),
                    }
                }),
            }
        );
        const result = await response.json();
        // Check for a 'yes' answer with a high enough score for confidence
        if (result && result[0] && result[0].answer.toLowerCase() === 'yes' && result[0].score > 0.8) return true;
        return false;
    } catch (error) {
        console.error("Image validation API failed:", error);
        // Default to true to attempt OCR if the validation service fails
        return true; 
    }
};

// --- Reusable Logic for Summarization ---
const getSummaryFromGroq = async (reportText) => {
  // We now use the imported prompt
  const systemPrompt = summarizeSystemPrompt;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Here is the medical report:\n\n${reportText}` }
    ],
    temperature: 0.5,
  });
  return completion.choices[0]?.message?.content || "Could not generate a summary.";
};

// --- API Endpoint for TEXT submission ---
app.post('/api/summarize', async (req, res) => {
  try {
    const { reportText } = req.body;
    if (!reportText) return res.status(400).json({ error: 'Report text is required.' });
    const summary = await getSummaryFromGroq(reportText);
    res.json({ summary, originalText: reportText });
  } catch (error) {
    console.error('Error in /api/summarize:', error);
    res.status(500).json({ error: 'Failed to generate summary.' });
  }
});

// --- API Endpoint for IMAGE submission ---
app.post('/api/summarize-image', upload.single('reportImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file uploaded.' });
    const isDocument = await validateImageIsReport(req.file.buffer);
    if (!isDocument) return res.status(400).json({ error: 'The uploaded image does not appear to be a medical report.' });
    
    const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'eng');
    if (!text || text.trim().length < 20) return res.status(500).json({ error: 'Could not extract sufficient text from the image.' });
    
    const summary = await getSummaryFromGroq(text);
    res.json({ summary, originalText: text });
  } catch (error) {
    console.error('Error in /api/summarize-image:', error);
    res.status(500).json({ error: 'Failed to process the image.' });
  }
});

// --- API Endpoint for CHAT functionality ---
app.post('/api/chat', async (req, res) => {
    try {
        const { originalReport, userQuestion } = req.body;
        if (!originalReport || !userQuestion) {
            return res.status(400).json({ error: 'Original report and user question are required.' });
        }

        const chatSystemPrompt = `
            You are a helpful medical assistant. 
            Your role is to answer follow-up questions about a medical report.
            Use the provided medical report as the single source of truth.
            Do NOT provide medical advice or diagnoses.
            Keep your answers concise, simple, and easy for a patient to understand.
            If the answer is not in the report, say "That information is not available in the report."
        `;

        const messages = [
            { role: "system", content: chatSystemPrompt },
            { role: "user", content: `Here is the medical report we are discussing:\n\n---\n${originalReport}\n---` },
            { role: "assistant", content: "I have read the report. How can I help you?" },
            { role: "user", content: userQuestion }
        ];

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: messages,
            temperature: 0.3,
        });

        const answer = completion.choices[0]?.message?.content || "I am sorry, I could not find an answer.";
        res.json({ answer });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: 'Failed to get a chat response.' });
    }
});

// --- API Endpoint for TRANSLATION functionality ---
app.post('/api/translate', async (req, res) => {
  try {
    const { textToTranslate, targetLanguage } = req.body;
    if (!textToTranslate || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required.' });
    }

    const translateSystemPrompt = `You are an expert translator. Translate the following text into ${targetLanguage}. Do not add any commentary or extra text. Only provide the direct translation.`;
    
    const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            { role: "system", content: translateSystemPrompt },
            { role: "user", content: textToTranslate }
        ],
        temperature: 0.1,
    });

    const translatedText = completion.choices[0]?.message?.content || "Translation failed.";
    res.json({ translatedText });

  } catch (error) {
    console.error('Error in /api/translate:', error);
    res.status(500).json({ error: 'Failed to translate the text.' });
  }
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

