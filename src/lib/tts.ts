import type { SupabaseClient } from "@supabase/supabase-js";
import type { PrimingSessionContent } from "@/lib/types/priming-session";

const GOOGLE_TTS_API_URL =
  "https://texttospeech.googleapis.com/v1/text:synthesize";

/** Google TTS API limit per request (bytes, not characters). */
const MAX_TTS_BYTES = 5000;

/**
 * Splits text into chunks that each fit within the Google TTS byte limit.
 * Splits on sentence boundaries (". ") to avoid cutting mid-word.
 */
function splitTextIntoChunks(text: string): string[] {
  const textBytes = Buffer.byteLength(text, "utf-8");
  if (textBytes <= MAX_TTS_BYTES) return [text];

  const sentences = text.split(/(?<=\.)\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const candidate = currentChunk ? currentChunk + " " + sentence : sentence;
    if (Buffer.byteLength(candidate, "utf-8") > MAX_TTS_BYTES) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      // If a single sentence exceeds the limit, split it by words
      if (Buffer.byteLength(sentence, "utf-8") > MAX_TTS_BYTES) {
        const words = sentence.split(/\s+/);
        let wordChunk = "";
        for (const word of words) {
          const wordCandidate = wordChunk ? wordChunk + " " + word : word;
          if (Buffer.byteLength(wordCandidate, "utf-8") > MAX_TTS_BYTES) {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = word;
          } else {
            wordChunk = wordCandidate;
          }
        }
        if (wordChunk) currentChunk = wordChunk;
        else currentChunk = "";
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk = candidate;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

/**
 * Flattens structured session content into a single plain-text string
 * suitable for TTS narration. Sections are separated with natural pauses.
 */
export function contentToNarrationText(content: PrimingSessionContent): string {
  const parts: string[] = [];

  // Introduction
  parts.push(content.introduction.title + ".");
  parts.push(content.introduction.paragraphs.join(" "));

  // Key Terms
  parts.push("Key Terms.");
  for (const term of content.keyTerms) {
    parts.push(`${term.term}: ${term.definition}`);
  }

  // Core Concepts
  parts.push("Core Concepts.");
  for (const concept of content.coreConcepts) {
    parts.push(`${concept.title}. ${concept.explanation}`);
  }

  // Lecture Preview
  parts.push(content.lecturePreview.title + ".");
  parts.push(content.lecturePreview.paragraphs.join(" "));

  return parts.join("\n\n");
}

/**
 * Synthesizes a single chunk of text via Google Cloud TTS.
 * Each chunk must be within the 5000-byte API limit.
 */
async function synthesizeChunk(text: string, apiKey: string): Promise<Buffer> {
  const requestBody = {
    input: { text },
    voice: {
      languageCode: "en-US",
      name: "en-US-Neural2-J",
      ssmlGender: "MALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 0.0,
    },
  };

  const response = await fetch(`${GOOGLE_TTS_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Google TTS API error ${response.status}: ${errorBody}`
    );
  }

  const data = (await response.json()) as { audioContent: string };
  return Buffer.from(data.audioContent, "base64");
}

/**
 * Calls Google Cloud Text-to-Speech API and returns a Buffer of the MP3.
 * Automatically splits text into chunks if it exceeds the 5000-byte API limit,
 * synthesizes each chunk separately, and concatenates the resulting MP3 buffers.
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_TTS_API_KEY environment variable is not set");
  }

  const chunks = splitTextIntoChunks(text);

  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    const buffer = await synthesizeChunk(chunk, apiKey);
    audioBuffers.push(buffer);
  }

  return Buffer.concat(audioBuffers);
}

/**
 * Uploads an MP3 buffer to Supabase Storage and returns the public URL.
 * File is stored at session-audio/{sessionId}.mp3
 */
export async function uploadAudioToStorage(
  adminClient: SupabaseClient,
  sessionId: string,
  audioBuffer: Buffer
): Promise<string> {
  const filePath = `${sessionId}.mp3`;

  const { error: uploadError } = await adminClient.storage
    .from("session-audio")
    .upload(filePath, audioBuffer, {
      contentType: "audio/mpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = adminClient.storage
    .from("session-audio")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
