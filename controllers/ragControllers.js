import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai"; 

/**
 * Error codes used in this file:
 * 'missing-note'        → note object not provided in request
 * 'missing-note-text'   → note.text missing or empty
 * 'invalid-options'     → quiz options invalid
 * 'unauthorized'        → user not logged in (future use with Clerk)
 * 'llm-failed'          → LLM request failed
 * 'invalid-llm-json'    → model returned bad JSON
 * null                  → success
 */

//load environmental variables
dotenv.config();

///////////MAKE SURE TO SET GEMINI_API_KEY in your .env file!!!! 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // reads API key from env

// -- JSON Schemas (Gemini Structured Output) --
// Gemini will generate JSON that matches these schemas when responseMimeType + responseJsonSchema are provided :contentReference[oaicite:4]{index=4}

// Summary JSON schema
const summaryJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short title for the summary." },
    bullets: {
      type: "array",
      description: "Bullet-point summary. Each item is one bullet.",
      items: { type: "string" },
      minItems: 3
    },
    keyTerms: {
      type: "array",
      description: "Key terms and definitions from the note.",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          definition: { type: "string" }
        },
        required: ["term", "definition"]
      }
    }
  },
  required: ["title", "bullets", "keyTerms"],
  additionalProperties: false
};

// Quiz JSON schema
const quizJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short title for the quiz." },
    questions: {
      type: "array",
      description: "List of multiple choice questions.",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique question id like q1, q2, ..." },
          question: { type: "string", description: "The question text." },
          choices: {
            type: "array",
            description: "Multiple choice options.",
            minItems: 2,
            items: {
              type: "object",
              properties: {
                id: { type: "string", description: "Choice label like A/B/C/D." },
                text: { type: "string", description: "Choice text." }
              },
              required: ["id", "text"]
            }
          },
          answer: { type: "string", description: "Correct choice id (e.g., 'B')." },
          explanation: { type: ["string", "null"], description: "Short explanation (optional)." },
          difficulty: { type: "string", description: "easy|medium|hard" }
        },
        required: ["id", "question", "choices", "answer", "difficulty"],
        additionalProperties: false
      }
    }
  },
  required: ["title", "questions"],
  additionalProperties: false
};

// --Helper Functions --

// Generate a unique request ID for debugging/logging
const makeRequestId = () =>
  `req_${Math.random().toString(16).slice(2)}_${Date.now()}`;


// Validate that the note object exists and has text
const validateNote = (note) => {
  // If note is missing or not an object → error
  if (!note || typeof note !== "object") return "missing-note";

  // If note.text missing or empty → error
  if (!note.text || typeof note.text !== "string" || note.text.trim().length === 0)
    return "missing-note-text";

  // Otherwise → valid
  return null;
};


// Validate quiz options like number of questions and difficulty
const validateQuizOptions = (options = {}) => {
  // Default values if options not provided
  const numQuestions = options.numQuestions ?? 10;
  const numChoices = options.numChoices ?? 4;
  const difficulty = options.difficulty ?? "medium";

  // Check numeric bounds
  if (typeof numQuestions !== "number" || numQuestions < 1 || numQuestions > 30)
    return "invalid-options";

  if (typeof numChoices !== "number" || numChoices < 2 || numChoices > 6)
    return "invalid-options";

  // Check allowed difficulty values
  if (!["easy", "medium", "hard"].includes(difficulty))
    return "invalid-options";

  // If all good → valid
  return null;
};


// Build the prompt sent to the AI model for summary generation
const buildSummaryPrompt = (noteText, opts = {}) => {
  // Read style/length/focus with defaults
  const style = opts.style ?? "bullet";
  const length = opts.length ?? "medium";
  const focus = opts.focus ?? ["key ideas", "definitions", "examples"];

  // Return formatted prompt string
  return `
You are a helpful study assistant.
Summarize the note below.

Style: ${style}
Length: ${length}
Focus: ${Array.isArray(focus) ? focus.join(", ") : focus}

Return JSON ONLY:
{
  "title": "string",
  "bullets": ["string", "..."],
  "keyTerms": [{"term":"string","definition":"string"}]
}

NOTE:
${noteText}
  `.trim();
};


// Build the prompt sent to the AI model for quiz generation
const buildQuizPrompt = (noteText, opts = {}) => {
  // Read options with defaults
  const numQuestions = opts.numQuestions ?? 10;
  const difficulty = opts.difficulty ?? "medium";
  const numChoices = opts.numChoices ?? 4;
  const includeExplanations = opts.includeExplanations ?? true;

  // Return formatted prompt string
  return `
You are a helpful study assistant.
Create a ${difficulty} MCQ quiz from the note below.

Rules:
- ${numQuestions} questions
- ${numChoices} choices per question
- Exactly ONE correct answer
- Clear questions
- includeExplanations=${includeExplanations}

Return JSON ONLY:
{
  "title": "string",
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "choices": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
      "answer": "B",
      "explanation": "string",
      "difficulty": "${difficulty}"
    }
  ]
}

NOTE:
${noteText}
  `.trim();
};

// -- Gemini Call: returns parsed JSON object --
async function callLLMJson(prompt, schema) {
  // If API key is missing, throw early (prevents confusing runtime errors)
  if (!process.env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY environment variable");

  const model = "gemini-3-flash-preview"; // good default for speed/cost/quality balance

  // Ask Gemini to return JSON that matches the schema 
  const response = await ai.models.generateContent({
    model, // which Gemini model to use
    contents: prompt, // prompt string
    config: {
      responseMimeType: "application/json", // forces JSON output 
      responseJsonSchema: schema, // forces JSON to match this schema 
      temperature: 0.2 // lower temperature = more consistent structure
    }
  });

  // Gemini returns a text field containing the JSON string
  let text = response.text ?? ""; // safe fallback

  // Some models sometimes wrap JSON in code fences (```json ... ```) → remove them 
  text = text.trim(); // remove extra whitespace
  text = text.replace(/^```json\s*/i, ""); // remove opening ```json
  text = text.replace(/^```\s*/i, ""); // remove opening ``` (sometimes no json tag)
  text = text.replace(/```$/i, ""); // remove ending ```
  text = text.trim(); // trim again after replacements

  // Parse JSON string into an object
  const parsed = JSON.parse(text); // throws if invalid JSON

  // Return JS object to controller
  return parsed;
}

// -- Controllers --


// SUMMARY ENDPOINT
export const ragSummaryHandler = async (req, res) => {
  // Create unique request ID
  const requestId = makeRequestId();

  // Extract note and options from request body
  const { note, options } = req.body;

  // Validate note
  const noteErr = validateNote(note);

  // If invalid → return 400 error
  if (noteErr) {
    return res.status(400).json({
      success: false,
      message: noteErr === "missing-note" ? "note is required" : "note.text is required",
      error: noteErr,
      requestId
    });
  }

  // Build AI prompt
  const prompt = buildSummaryPrompt(note.text, options);

  try {
    // Call AI model
    const llmJson = await callLLMJson(prompt, summaryJsonSchema);

    // Ensure AI returned valid JSON
    if (!llmJson || typeof llmJson !== "object") {
      return res.status(500).json({
        success: false,
        message: "LLM returned invalid JSON",
        error: "invalid-llm-json",
        requestId
      });
    }

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Summary generated successfully",
      error: null,
      requestId,
      noteId: note.id ?? null,
      type: "summary",
      summary: llmJson
    });

  } catch (err) {
    // Log error for debugging
    console.error("Error generating summary:", err);

    // Return failure response
    return res.status(500).json({
      success: false,
      message: "Failed to generate summary",
      error: "llm-failed",
      details: err?.message ?? String(err),
      requestId
    });
  }
};

// QUIZ ENDPOINT
export const ragQuizHandler = async (req, res) => {
  // Generate request ID
  const requestId = makeRequestId();

  // Extract body
  const { note, options } = req.body;

  // Validate note
  const noteErr = validateNote(note);
  if (noteErr) {
    return res.status(400).json({
      success: false,
      message: noteErr === "missing-note" ? "note is required" : "note.text is required",
      error: noteErr,
      requestId
    });
  }

  // Validate quiz options
  const optErr = validateQuizOptions(options);
  if (optErr) {
    return res.status(400).json({
      success: false,
      message: "Invalid quiz options",
      error: optErr,
      requestId
    });
  }

  // Build quiz prompt
  const prompt = buildQuizPrompt(note.text, options);

  try {
    // Call AI model
    const llmJson = await callLLMJson(prompt, quizJsonSchema);

    // Ensure quiz JSON structure is valid
    if (!llmJson || typeof llmJson !== "object" || !Array.isArray(llmJson.questions)) {
      return res.status(500).json({
        success: false,
        message: "LLM returned invalid quiz JSON",
        error: "invalid-llm-json",
        requestId
      });
    }

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Quiz generated successfully",
      error: null,
      requestId,
      noteId: note.id ?? null,
      type: "quiz",
      quiz: llmJson
    });

  } catch (err) {
    // Log error
    console.error("Error generating quiz:", err);

    // Return failure response
    return res.status(500).json({
      success: false,
      message: "Failed to generate quiz",
      error: "llm-failed",
      details: err?.message ?? String(err),
      requestId
    });
  }
};

// HEALTH CHECK ENDPOINT
export const ragHealthHandler = (req, res) => {
  // Simple endpoint to verify server is running
  res.status(200).json({
    success: true,
    message: "RAG API is healthy",
    error: null
  });
};
