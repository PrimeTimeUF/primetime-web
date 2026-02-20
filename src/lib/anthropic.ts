import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type {
  PrimingSessionContent,
  SessionQuestion,
} from "@/lib/types/priming-session";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type QuestionRow = Omit<SessionQuestion, "id" | "session_id" | "created_at">;

export interface GenerationResult {
  title: string;
  content: PrimingSessionContent;
  questions: QuestionRow[];
}

type SessionDuration = 10 | 15 | 30;

const MAX_INPUT_CHARS = 100_000;

/** Quiz question counts per duration tier. */
const QUESTION_COUNTS: Record<SessionDuration, number> = {
  10: 4,
  15: 5,
  30: 8,
};

/* ------------------------------------------------------------------ */
/*  Prompt file loading                                                */
/* ------------------------------------------------------------------ */

const PROMPT_FILES: Record<SessionDuration, string> = {
  10: "priming-10min.txt",
  15: "priming-15min.txt",
  30: "priming-30min.txt",
};

const promptCache = new Map<SessionDuration, string>();

function loadPrompt(duration: SessionDuration): string {
  const cached = promptCache.get(duration);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), "prompts", PROMPT_FILES[duration]);
  const content = fs.readFileSync(filePath, "utf-8");
  promptCache.set(duration, content);
  return content;
}

/* ------------------------------------------------------------------ */
/*  Raw prompt response types (matches prompts/*.txt output schema)    */
/* ------------------------------------------------------------------ */

interface PromptKeyConcept {
  term: string;
  definition: string;
  example: string;
}

interface PromptQuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

/** Content-only response from Sonnet (no quiz field). */
interface ContentResponse {
  title: string;
  overview: string;
  key_concepts: PromptKeyConcept[];
  audio_script: string;
}

/* ------------------------------------------------------------------ */
/*  Map prompt response → app types                                    */
/* ------------------------------------------------------------------ */

function splitIntoParagraphs(text: string): string[] {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs : [text];
}

function mapToContent(raw: ContentResponse): PrimingSessionContent {
  return {
    introduction: {
      title: "Introduction",
      paragraphs: splitIntoParagraphs(raw.overview),
    },
    keyTerms: raw.key_concepts.map((kc) => ({
      term: kc.term,
      definition: kc.example
        ? `${kc.definition} Example: ${kc.example}`
        : kc.definition,
    })),
    coreConcepts: raw.key_concepts.map((kc) => ({
      title: kc.term,
      explanation: kc.definition,
    })),
    lecturePreview: {
      title: "What to Expect in This Lecture",
      paragraphs: splitIntoParagraphs(raw.audio_script).slice(0, 3),
    },
  };
}

function mapToQuestions(quiz: PromptQuizQuestion[]): QuestionRow[] {
  return quiz.map((q, i) => {
    const letterToKey = (letter: string) =>
      letter.trim().toLowerCase().charAt(0) as "a" | "b" | "c" | "d";

    // Strip "A. ", "B. ", etc. prefixes from options
    const stripLabel = (opt: string) => opt.replace(/^[A-Da-d]\.\s*/, "");

    return {
      question_number: i + 1,
      question_text: q.question,
      option_a: stripLabel(q.options[0] ?? ""),
      option_b: stripLabel(q.options[1] ?? ""),
      option_c: stripLabel(q.options[2] ?? ""),
      option_d: stripLabel(q.options[3] ?? ""),
      correct_answer: letterToKey(q.correct_answer),
      explanation: q.explanation,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncateText(text: string): string {
  return text.length > MAX_INPUT_CHARS
    ? text.slice(0, MAX_INPUT_CHARS) + "\n\n[Text truncated due to length]"
    : text;
}

function extractJsonResponse(message: Anthropic.Message): string {
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI");
  }
  // Strip markdown code fences if the model wraps its JSON response
  return textBlock.text
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "");
}


/* ------------------------------------------------------------------ */
/*  Step 1: Sonnet generates content (overview, key concepts, audio)   */
/* ------------------------------------------------------------------ */

async function generateContent(
  truncatedText: string,
  label: string,
  duration: SessionDuration
): Promise<ContentResponse> {
  // Load the prompt file but tell the model to skip the quiz —
  // we generate that separately with Haiku for cost efficiency.
  const basePrompt = loadPrompt(duration);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system:
      basePrompt +
      '\n\nIMPORTANT: Return ONLY a JSON object with these fields: "title", "overview", "key_concepts", and "audio_script". The "title" should be a short, descriptive name for the session (e.g. "The Roman Empire: Power, Diversity, and Legacy") — NOT a full sentence. Do NOT include the "quiz" field — it will be generated separately. Return ONLY the JSON object, no markdown formatting or code blocks.',
    messages: [
      {
        role: "user",
        content: `Please create a priming session for the following lecture material ("${label}"):\n\n${truncatedText}`,
      },
    ],
  });

  const parsed = JSON.parse(extractJsonResponse(message)) as ContentResponse;

  if (!parsed.title || !parsed.overview || !parsed.key_concepts) {
    throw new Error("AI content response missing required fields");
  }

  return parsed;
}

/* ------------------------------------------------------------------ */
/*  Step 2: Haiku generates quiz from ONLY the session content         */
/*  (never sees raw lecture text → can't quiz on uncovered material)   */
/* ------------------------------------------------------------------ */

const QUIZ_SYSTEM_PROMPT = `You are an expert quiz question writer for educational content. You will be given the content of a priming session (overview, key concepts, and audio script). Generate multiple-choice quiz questions that test student comprehension.

CRITICAL: You must ONLY test on information explicitly present in the provided session content. You will not receive the original lecture materials — the session content is your sole source of truth. Every question must be answerable by a student who has only read the session content.

Return your response as a single JSON object with this exact structure:
{
  "quiz": [
    {
      "question": "Question text here?",
      "options": ["A. Option text", "B. Option text", "C. Option text", "D. Option text"],
      "correct_answer": "A",
      "explanation": "Explanation of why this is correct"
    }
  ]
}

Guidelines:
- Questions should test understanding, not just recall
- Mix difficulty: include easy, medium, and challenging questions
- At least one question should require applying a concept to a new scenario
- Explanations should be concise and educational
- Distractors should be plausible but clearly wrong

IMPORTANT: Return ONLY the JSON object, no markdown formatting or code blocks.`;

async function generateQuestions(
  contentResponse: ContentResponse,
  questionCount: number
): Promise<QuestionRow[]> {
  // Build a text summary of the session content — this is ALL Haiku sees.
  const conceptsList = contentResponse.key_concepts
    .map(
      (kc) =>
        `- ${kc.term}: ${kc.definition}${kc.example ? ` (Example: ${kc.example})` : ""}`
    )
    .join("\n");

  const sessionContent = `Overview:\n${contentResponse.overview}\n\nKey Concepts:\n${conceptsList}\n\nAudio Script:\n${contentResponse.audio_script}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: QUIZ_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate exactly ${questionCount} quiz questions based on this priming session content:\n\n${sessionContent}`,
      },
    ],
  });

  const parsed = JSON.parse(extractJsonResponse(message)) as {
    quiz: PromptQuizQuestion[];
  };

  if (!parsed.quiz || parsed.quiz.length !== questionCount) {
    throw new Error(
      `Expected ${questionCount} questions, got ${parsed.quiz?.length ?? 0}`
    );
  }

  return mapToQuestions(parsed.quiz);
}

/* ------------------------------------------------------------------ */
/*  Main generation function                                           */
/* ------------------------------------------------------------------ */

export async function generatePrimingSession(
  pdfText: string,
  label: string,
  duration: SessionDuration = 15
): Promise<GenerationResult> {
  const truncatedText = truncateText(pdfText);
  const questionCount = QUESTION_COUNTS[duration];

  // Step 1: Sonnet generates content from the raw lecture materials
  const contentResponse = await generateContent(truncatedText, label, duration);

  // Step 2: Haiku generates quiz from ONLY the session content
  // (no raw lecture text → structurally can't quiz on uncovered material)
  const questions = await generateQuestions(contentResponse, questionCount);

  return {
    title: contentResponse.title,
    content: mapToContent(contentResponse),
    questions,
  };
}
