import Anthropic from "@anthropic-ai/sdk";
import type {
  PrimingSessionContent,
  SessionQuestion,
} from "@/lib/types/priming-session";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ContentResult {
  title: string;
  content: PrimingSessionContent;
}

type QuestionRow = Omit<SessionQuestion, "id" | "session_id" | "created_at">;

export interface GenerationResult {
  title: string;
  content: PrimingSessionContent;
  questions: QuestionRow[];
}

const MAX_INPUT_CHARS = 100_000;

const CONTENT_SYSTEM_PROMPT = `You are an expert educational content designer. Given the text content of a lecture PDF, create a "priming session" that prepares students to engage with the upcoming lecture.

Return your response as a single JSON object with this exact structure:
{
  "title": "A concise, descriptive title for this priming session",
  "content": {
    "introduction": {
      "title": "Introduction to [topic]",
      "paragraphs": ["paragraph1", "paragraph2"]
    },
    "keyTerms": [
      { "term": "Term Name", "definition": "Clear, concise definition" }
    ],
    "coreConcepts": [
      { "title": "Concept Title", "explanation": "Clear explanation of the concept" }
    ],
    "lecturePreview": {
      "title": "What to Expect in This Lecture",
      "paragraphs": ["paragraph1"]
    }
  }
}

Guidelines:
- Introduction: 2 engaging paragraphs that set context and motivate students
- Key Terms: 4-6 essential vocabulary terms with clear definitions
- Core Concepts: 3-4 main ideas students should understand before the lecture
- Lecture Preview: 1-2 paragraphs describing what the lecture will cover
- Keep language accessible and educational
- Focus on helping students prepare, not summarize the entire lecture

IMPORTANT: Return ONLY the JSON object, no markdown formatting or code blocks.`;

const QUESTIONS_SYSTEM_PROMPT = `You are an expert quiz question writer for educational content. Given the text content of a lecture PDF and a summary of its key concepts, generate multiple-choice quiz questions that test student comprehension.

Return your response as a single JSON object with this exact structure:
{
  "questions": [
    {
      "question_number": 1,
      "question_text": "Question text here?",
      "option_a": "Option A text",
      "option_b": "Option B text",
      "option_c": "Option C text",
      "option_d": "Option D text",
      "correct_answer": "a",
      "explanation": "Explanation of why this is correct"
    }
  ]
}

Guidelines:
- Generate exactly 4 multiple-choice questions (A-D)
- Questions should test understanding, not just recall
- Include one easy, two medium, and one challenging question
- Explanations should be concise and educational
- Distractors should be plausible but clearly wrong

IMPORTANT: Return ONLY the JSON object, no markdown formatting or code blocks.`;

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
  return textBlock.text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
}

async function generateContent(
  truncatedText: string,
  fileName: string
): Promise<ContentResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: CONTENT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please create a priming session for the following lecture material (file: "${fileName}"):\n\n${truncatedText}`,
      },
    ],
  });

  const parsed = JSON.parse(extractJsonResponse(message)) as ContentResult;

  if (!parsed.title || !parsed.content) {
    throw new Error("AI content response missing required fields");
  }

  return parsed;
}

async function generateQuestions(
  truncatedText: string,
  contentSummary: ContentResult
): Promise<QuestionRow[]> {
  const keyTermsList = contentSummary.content.keyTerms
    .map((t) => `- ${t.term}: ${t.definition}`)
    .join("\n");

  const conceptsList = contentSummary.content.coreConcepts
    .map((c) => `- ${c.title}: ${c.explanation}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: QUESTIONS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate 4 quiz questions for this lecture material.\n\nKey Terms:\n${keyTermsList}\n\nCore Concepts:\n${conceptsList}\n\nSource Material:\n${truncatedText}`,
      },
    ],
  });

  const parsed = JSON.parse(extractJsonResponse(message)) as {
    questions: QuestionRow[];
  };

  if (!parsed.questions || parsed.questions.length !== 4) {
    throw new Error(
      `Expected 4 questions, got ${parsed.questions?.length ?? 0}`
    );
  }

  return parsed.questions;
}

export async function generatePrimingSession(
  pdfText: string,
  fileName: string
): Promise<GenerationResult> {
  const truncatedText = truncateText(pdfText);

  // Step 1: Sonnet 4.5 generates the content summary
  const contentResult = await generateContent(truncatedText, fileName);

  // Step 2: Haiku 4.5 generates quiz questions using the content + source text
  const questions = await generateQuestions(truncatedText, contentResult);

  return {
    title: contentResult.title,
    content: contentResult.content,
    questions,
  };
}
