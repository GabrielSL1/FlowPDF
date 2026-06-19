'use server';
/**
 * @fileOverview An AI agent for analyzing PDF document content and suggesting relevant tags and keywords.
 *
 * - tagDocument - A function that handles the document tagging process.
 * - AIDocumentTaggingInput - The input type for the tagDocument function.
 * - AIDocumentTaggingOutput - The return type for the tagDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIDocumentTaggingInputSchema = z.object({
  documentContent: z
    .string()
    .describe('The extracted text content of the PDF document.'),
});
export type AIDocumentTaggingInput = z.infer<typeof AIDocumentTaggingInputSchema>;

const AIDocumentTaggingOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('A list of 3-5 concise tags relevant to the document content.'),
  keywords: z
    .array(z.string())
    .describe('A list of 5-10 relevant keywords extracted from the document content.'),
});
export type AIDocumentTaggingOutput = z.infer<typeof AIDocumentTaggingOutputSchema>;

export async function tagDocument(
  input: AIDocumentTaggingInput
): Promise<AIDocumentTaggingOutput> {
  return aiDocumentTaggingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiDocumentTaggingPrompt',
  input: {schema: AIDocumentTaggingInputSchema},
  output: {schema: AIDocumentTaggingOutputSchema},
  prompt: `You are an AI assistant specialized in analyzing PDF document content to extract relevant tags and keywords.
  
  Analyze the following document content and suggest 3-5 concise tags and 5-10 relevant keywords that summarize its main topics.
  The tags should be single words or short phrases. Keywords can be more specific terms or concepts.
  Respond in JSON format according to the provided output schema.
  
  Document Content:
  {{{documentContent}}}`,
});

const aiDocumentTaggingFlow = ai.defineFlow(
  {
    name: 'aiDocumentTaggingFlow',
    inputSchema: AIDocumentTaggingInputSchema,
    outputSchema: AIDocumentTaggingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
