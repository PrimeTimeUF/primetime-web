export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid pdf-parse loading a test PDF at module evaluation time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse") as (
    buffer: Buffer
  ) => Promise<{ text: string }>;

  const data = await pdfParse(buffer);

  if (!data.text || data.text.trim().length === 0) {
    throw new Error(
      "No text content could be extracted from this PDF. It may be a scanned document or contain only images."
    );
  }

  return data.text;
}
