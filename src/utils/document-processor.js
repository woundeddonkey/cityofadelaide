import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractPersonFromDocument } from './person/person-extractor.js';
import { llmFactory, registerAllProviders, getAvailableProviders } from './llm/index.js';

// Get the directory name using import.meta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the LLM providers if needed
let providersInitialized = false;

/**
 * Initialize all available LLM providers
 * This is called automatically when needed
 */
async function initializeLLMProviders() {
  if (providersInitialized) return;
  
  try {
    await registerAllProviders();
    providersInitialized = true;
    
    // Set the default provider based on environment or configuration
    // This could be read from a config file or environment variable
    const defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'mock';
    const availableProviders = getAvailableProviders();
    
    if (availableProviders.includes(defaultProvider)) {
      llmFactory.setDefaultProvider(defaultProvider);
    }
    
    console.log(`Available LLM providers: ${availableProviders.join(', ')}`);
    console.log(`Default provider: ${llmFactory.defaultProvider}`);
  } catch (error) {
    console.error('Error initializing LLM providers:', error);
  }
}

/**
 * Process a Word document to extract person information
 * @param {string} filePath - Path to the Word document
 * @param {Object} options - Options for processing
 * @returns {Promise<Object>} - Result of processing
 */
export async function processWordDocument(filePath, options = {}) {
  try {
    // Initialize LLM providers if not already done
    if (!providersInitialized) {
      await initializeLLMProviders();
    }
    
    // 1. Extract text from Word document
    console.log(`Processing document: ${filePath}`);
    const { value: docText } = await mammoth.extractRawText({ path: filePath });
    
    // 2. Use the person extractor to process the document text
    const extractionResult = await extractPersonFromDocument(docText, {
      llm: options.llm,
      llmOptions: options.llmOptions || {},
      provider: options.provider // Pass the provider name
    });
    
    return extractionResult;
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

/**
 * Configure the document processor with specific options
 * @param {Object} options - Configuration options
 * @param {string} options.llmProvider - The LLM provider to use (e.g., 'openai', 'mock')
 * @param {Object} options.llmOptions - Options to pass to the LLM
 * @returns {Object} - The configuration status
 */
export function configureDocumentProcessor(options = {}) {
  try {
    if (options.llmProvider) {
      if (llmFactory.providers[options.llmProvider]) {
        llmFactory.setDefaultProvider(options.llmProvider);
        console.log(`Set default LLM provider to ${options.llmProvider}`);
      } else {
        console.warn(`Provider '${options.llmProvider}' is not registered`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error configuring document processor:", error);
    return { success: false, error: error.message };
  }
}
