import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processWordDocument, configureDocumentProcessor } from './src/utils/document-processor.js';

/**
 * Generate an expected JSON file for a given Word document
 * This extracts the document and creates a template expected JSON file
 * @param {string} docxPath - Path to the Word document
 * @param {Object} options - Options for processing
 * @param {string} options.provider - The LLM provider to use (e.g., 'openai', 'mock', 'claude')
 * @param {Object} options.llmOptions - Additional options to pass to the LLM
 * @returns {Promise<Object>} - Result with success flag and details
 */
async function generateExpectedJson(docxPath, options = {}) {
  console.log(`Generating expected JSON for ${path.basename(docxPath)}`);
  
  try {
    // Configure the document processor with the specified LLM if provided
    if (options.provider) {
      console.log(`Using LLM provider: ${options.provider}`);
      configureDocumentProcessor({ llmProvider: options.provider });
    }
    
    // Process the document
    const processingOptions = {
      saveResults: false,
      provider: options.provider,
      llmOptions: options.llmOptions || {}
    };
    
    const extractionResult = await processWordDocument(docxPath, processingOptions);
    
    if (!extractionResult.success) {
      return {
        success: false,
        error: `Extraction failed: ${extractionResult.error}`
      };
    }
    
    // Generate the expected JSON file path
    const parsedPath = path.parse(docxPath);
    const expectedJsonPath = path.join(parsedPath.dir, `${parsedPath.name}.expected.json`);
    
    // Write the extracted data as the expected JSON
    await fs.promises.writeFile(expectedJsonPath, JSON.stringify(extractionResult.data, null, 2), 'utf8');
    
    return {
      success: true,
      docxPath,
      expectedJsonPath,
      message: `Generated expected JSON for ${path.basename(docxPath)} at ${expectedJsonPath}`
    };
  } catch (error) {
    return {
      success: false,
      docxPath,
      error: `Error generating expected JSON: ${error.message}`
    };
  }
}

/**
 * Generate expected JSON files for multiple documents
 * @param {Array<string>} docxPaths - Array of paths to Word documents
 * @param {Object} options - Options for processing
 * @param {string} options.provider - The LLM provider to use
 * @param {Object} options.llmOptions - Additional options to pass to the LLM
 * @returns {Promise<Array>} - Array of generation results
 */
async function generateMultipleExpectedJson(docxPaths, options = {}) {
  const results = [];
  
  for (const docxPath of docxPaths) {
    const result = await generateExpectedJson(docxPath, options);
    results.push(result);
    
    // Log the result
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Failed to generate expected JSON for ${path.basename(docxPath)}: ${result.error}`);
    }
  }
  
  return results;
}

/**
 * Main function to run the generation
 */
async function main() {
  const args = process.argv.slice(2);
  let provider = 'mock'; // Default to mock provider
  let llmOptions = {};
  let docxPaths = [];
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider' && i + 1 < args.length) {
      provider = args[i + 1];
      i++; // Skip the next argument
    } else if (args[i] === '--options' && i + 1 < args.length) {
      try {
        llmOptions = JSON.parse(args[i + 1]);
        i++; // Skip the next argument
      } catch (e) {
        console.error('Error parsing LLM options:', e.message);
      }
    } else if (args[i].endsWith('.docx')) {
      docxPaths.push(args[i]);
    }
  }
  
  // If no docx files are provided, show usage information
  if (docxPaths.length === 0) {
    console.error('Please provide one or more .docx file paths to generate expected JSON files.');
    console.error('Usage: node generate-expected-json.js [--provider providerName] [--options \'{"key":"value"}\'] file1.docx file2.docx ...');
    console.error('Available providers: openai, claude, mock (default)');
    process.exit(1);
  }
  
  console.log(`Using LLM provider: ${provider}`);
  await generateMultipleExpectedJson(docxPaths, { provider, llmOptions });
}

// Run the main function if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export the functions for use in other files
export {
  generateExpectedJson,
  generateMultipleExpectedJson
};
