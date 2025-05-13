import mammoth from 'mammoth';
import { Validator } from 'jsonschema';
import { PERSON_EXTRACTION_PROMPT } from '../prompts/person-extraction-prompt.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the schema file directly instead of importing it
const personSchemaPath = path.join(__dirname, '..', 'schemas', 'person-schema.json');
const personSchema = JSON.parse(fs.readFileSync(personSchemaPath, 'utf8'));

/**
 * A stubbed LLM function that returns a valid person JSON
 * This is just for testing purposes and would be replaced with a real LLM call
 * @param {string} prompt - The prompt with document text to analyze
 * @returns {string} - JSON string representing the extracted person data
 */
async function stubbedLLM(prompt) {
  console.log('Received prompt:', prompt.substring(0, 100) + '...');
  
  // Skip trying to extract document text for now as it may not be in the expected format
  console.log('Document processing requested...');
  
  // Return a stubbed valid person JSON
  // In a real implementation, this would come from the LLM
  const mockPerson = {
    first_name: "John",
    middle_names: "William",
    last_name: "Smith",
    gender: "Male",
    birth_date: "1850-03-15",
    birth_place: "London, England",
    death_date: "1920-11-23",
    death_place: "Adelaide, Australia",
    age_at_death: "70 years",
    burial_place: "Adelaide Cemetery"
  };
  
  return JSON.stringify(mockPerson);
}

/**
 * Process a Word document to extract person information
 * @param {string} filePath - Path to the Word document
 * @returns {Promise<Object>} - Result of processing
 */
export async function processWordDocument(filePath) {
  try {
    // 1. Extract text from Word document
    console.log(`Processing document: ${filePath}`);
    const { value: docText } = await mammoth.extractRawText({ path: filePath });
    
    // 2. Prepare prompt with document text
    const prompt = PERSON_EXTRACTION_PROMPT.replace('[DOCUMENT_TEXT]', docText);
    
    // 3. Call the stubbed LLM
    console.log('Calling LLM...');
    const llmResponse = await stubbedLLM(prompt);
    
    // 4. Parse and validate the JSON
    let personData;
    try {
      personData = JSON.parse(llmResponse);
      
      // Validate against schema
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
      // In a real implementation, you would save this to Amplify here
      return { 
        success: true, 
        data: personData 
      };
    } catch (error) {
      console.error("Error parsing LLM response:", error);
      return { 
        success: false, 
        error: `Error parsing LLM response: ${error.message}`,
        rawResponse: llmResponse
      };
    }
  } catch (error) {
    console.error("Error processing document:", error);
    return { 
      success: false, 
      error: `Error processing document: ${error.message}`
    };
  }
}

/**
 * Get a sample document from the test directory
 * @returns {string} - Path to a sample document
 */
export function getSampleDocumentPath() {
  return '/Users/richardcrawford/projects/cityofadelaide/documents/_Tests/PersonDetails.docx';
}