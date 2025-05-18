import { Validator } from 'jsonschema';
import { PERSON_EXTRACTION_PROMPT } from '../../prompts/person-extraction-prompt.js';
import { llmFactory } from '../llm/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema file directly
const personSchemaPath = path.join(__dirname, '..', '..', 'schemas', 'person-schema.json');
const personSchema = JSON.parse(fs.readFileSync(personSchemaPath, 'utf8'));

/**
 * Extract person information from document text using an LLM
 * @param {string} documentText - The text content of the document to analyze
 * @param {Object} options - Options for the extraction process
 * @returns {Promise<Object>} - Result of extraction with person data
 */
export async function extractPersonFromDocument(documentText, options = {}) {
  try {
    // 1. Prepare the prompt with document text
    const prompt = PERSON_EXTRACTION_PROMPT.replace('[DOCUMENT_TEXT]', documentText);
    
    // 2. Get an LLM instance (use the specified provider or default)
    let llm;
    if (options.llm) {
      // Use the provided LLM instance directly
      llm = options.llm;
    } else if (options.provider) {
      // Create an LLM with the specified provider
      llm = llmFactory.create(options.provider);
    } else {
      // Use the default provider
      llm = llmFactory.create();
    }
    
    // 3. Call the LLM with the prompt
    console.log(`Calling LLM (${options.provider || 'default'} provider) to extract person data...`);
    let personData;
    
    try {
      // Try to get JSON directly if the LLM supports it
      personData = await llm.generateJSON(prompt, {
        systemPrompt: 'You are a specialized assistant for extracting historical biographical information. Output valid JSON only.',
        responseFormat: 'json',
        ...options.llmOptions
      });
    } catch (jsonError) {
      // Fallback to parsing the text response
      console.warn('Failed to get JSON directly, parsing text response instead:', jsonError.message);
      const textResponse = await llm.generateResponse(prompt, options.llmOptions);
      personData = JSON.parse(textResponse);
    }
    
    // 4. Validate the extracted data against the schema
    const validator = new Validator();
    const validationResult = validator.validate(personData, personSchema);
    
    if (!validationResult.valid) {
      console.error("Validation errors:", validationResult.errors);
      return { 
        success: false, 
        errors: validationResult.errors,
        data: personData
      };
    }
    
    // 5. Return the validated person data
    return { 
      success: true, 
      data: personData 
    };
  } catch (error) {
    console.error("Error extracting person from document:", error);
    return { 
      success: false, 
      error: `Error extracting person data: ${error.message}`
    };
  }
}
