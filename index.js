const express = require('express');

const app = express();
const PORT = 3000;

// Simulate API calls
const callModel = async (modelName, delay, successRate) => {
    await new Promise(r => setTimeout(r, delay));
    if (Math.random() > successRate) throw new Error(`${modelName} failed`);
    return {
        model: modelName,
        confidence: 0.5 + Math.random() * 0.5,
        result: Math.random() > 0.5 ? 'Human' : 'AI'
    };
};

const modelA = () => callModel('ModelA', 1000, 0.9);
const modelB = () => callModel('ModelB', 2000, 0.7);
const modelC = () => callModel('ModelC', 3000, 0.95);

// Predefined questions
const questions = [
    "Tell me about yourself",
    "Why this company?",
    "Greatest weakness?",
    "Describe a challenge you solved",
    "Where do you see yourself in 5 years?"
];

/**
 * Detects whether the answer to a question is AI or Human using fallback logic.
 * Tries Model A, then B, then C.
 * Returns model used, confidence, result, time taken (ms), and the original question.
 */
const detectAIResponse = async (question) => {
  const start = Date.now();

  try {
    const result = await modelA();
    return { ...result, question, timeTaken: Date.now() - start };
  } catch (errA) {
    console.warn(`[${new Date().toISOString()}] ❌ ModelA failed: ${errA.message} after ${Date.now() - start}ms`);
    try {
      const result = await modelB();
      return { ...result, question, timeTaken: Date.now() - start - 1000};
    } catch (errB) {
      console.warn(`[${new Date().toISOString()}] ❌ ModelB failed: ${errA.message} after ${Date.now() - start - 1000}ms`);
      try {
        const result = await modelC();
        return { ...result, question, timeTaken: Date.now() - start - 3000 };
      } catch (errC) {
        console.error(`[${new Date().toISOString()}] ❌ ModelC failed: ${errC.message} after ${Date.now() - start - 3000}ms`);
        throw new Error('All models failed');
      }
    }
  }
};

// GET /results endpoint
// Supports optional ?question=... for single-question testing
app.get('/results', async (req, res) => {
    const { question } = req.query;
    const questionsToProcess = question ? [question] : questions;

    try {
        const results = await Promise.all(questionsToProcess.map(detectAIResponse));
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});