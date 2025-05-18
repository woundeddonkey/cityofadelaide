import { Validator } from 'jsonschema';
import { PERSON_EXTRACTION_PROMPT } from '../../prompts/person-extraction-prompt.js';
import { llmFactory } from '../llm/index.js';
import { extractJsonFromText, normalizePersonsData } from '../json-helpers.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema files directly
const personSchemaPath = path.join(__dirname, '..', '..', 'schemas', 'person-schema.json');
const personsSchemaPath = path.join(__dirname, '..', '..', 'schemas', 'persons-schema.json');
const personSchema = JSON.parse(fs.readFileSync(personSchemaPath, 'utf8'));
const personsSchema = JSON.parse(fs.readFileSync(personsSchemaPath, 'utf8'));

/**
 * Extract persons information from document text using an LLM
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
    console.log(`Calling LLM (${options.provider || 'default'} provider) to extract persons data...`);
    let personsData;
    
    // Use JSON mode for openai if possible (to ensure proper JSON response)
    const llmOptions = {
      ...options.llmOptions
    };
    
    // Special handling for OpenAI to ensure proper JSON response
    if (options.provider === 'openai') {
      llmOptions.systemPrompt = 'You are a specialized assistant for extracting historical biographical information. Return your response as a valid JSON object with a "persons" array containing all people.';
      llmOptions.model = llmOptions.model || 'gpt-4-turbo';
      llmOptions.temperature = 0.2;
      // Get raw response format
      llmOptions.responseFormat = { type: "json_object" };
    } else {
      llmOptions.systemPrompt = 'You are a specialized assistant for extracting historical biographical information. Your output should ALWAYS be valid JSON only.';
    }
    
    try {
      // Try to get JSON directly if the LLM supports it
      personsData = await llm.generateJSON(prompt, llmOptions);
      personsData = normalizePersonsData(personsData);
      console.log(`Successfully parsed JSON response with ${personsData.length} person(s)`);
      
    } catch (jsonError) {
      // Fallback to parsing the text response
      console.warn('Failed to get JSON directly, parsing text response instead:', jsonError.message);
      const textResponse = await llm.generateResponse(prompt, llmOptions);
      
      // Extract and normalize the JSON from the text response
      const extractedJson = extractJsonFromText(textResponse);
      if (!extractedJson) {
        throw new Error(`Could not extract valid JSON from the response. Raw response: ${textResponse.substring(0, 100)}...`);
      }
      
      personsData = normalizePersonsData(extractedJson);
      console.log(`Successfully extracted JSON from text with ${personsData.length} person(s)`);
    }
    
    // Check if we received a single person object or an array
    const isArrayResponse = Array.isArray(personsData);
    
    // 4. Validate the extracted data against the schema
    const validator = new Validator();
    
    let validationResult;
    
    if (isArrayResponse) {
      // If it's an array, validate against the persons schema
      validationResult = validator.validate(personsData, personsSchema);
      
      // Also validate each person individually against the person schema
      if (validationResult.valid) {
        for (let i = 0; i < personsData.length; i++) {
          const personValidation = validator.validate(personsData[i], personSchema);
          if (!personValidation.valid) {
            console.error(`Validation errors in person #${i+1}:`, personValidation.errors);
            validationResult = personValidation;
            break;
          }
        }
      }
    } else {
      // If it's a single object, validate against the person schema
      validationResult = validator.validate(personsData, personSchema);
    }
    
    if (!validationResult.valid) {
      console.error("Validation errors:", validationResult.errors);
      // Attempt to return partial data if possible
      const partialData = isArrayResponse ? personsData : [personsData];
      return { 
        success: false, 
        errors: validationResult.errors,
        data: partialData
      };
    }
    
    // 5. Return the validated person data (always as an array for consistency)
    const finalData = isArrayResponse ? personsData : [personsData];
    console.log(`Successfully extracted ${finalData.length} person(s) from document`);
    return { 
      success: true, 
      data: finalData
    };
  } catch (error) {
    console.error("Error extracting persons from document:", error);
    return { 
      success: false, 
      error: `Error extracting persons data: ${error.message}`
    };
  }
}
