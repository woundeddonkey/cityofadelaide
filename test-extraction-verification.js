import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processWordDocument, configureDocumentProcessor } from './src/utils/document-processor.js';

/**
 * Compare two JSON objects for equality
 * This does a deep comparison of the person objects
 * @param {Object} actual - The actual extracted person data
 * @param {Object} expected - The expected person data
 * @returns {Object} - Result with success flag and differences if any
 */
function comparePersonObjects(actual, expected) {
  const differences = [];
  
  // Check if actual has all the expected fields
  for (const key of Object.keys(expected)) {
    if (!(key in actual)) {
      differences.push(`Expected field '${key}' is missing in the actual data`);
    } else if (typeof expected[key] === 'object' && expected[key] !== null) {
      // Recursively compare nested objects
      const nestedResult = comparePersonObjects(actual[key], expected[key]);
      if (!nestedResult.success) {
        differences.push(`Differences in nested field '${key}': ${nestedResult.differences.join(', ')}`);
      }
    } else if (actual[key] !== expected[key]) {
      differences.push(`Field '${key}' value mismatch: expected '${expected[key]}', got '${actual[key]}'`);
    }
  }
  
  return {
    success: differences.length === 0,
    differences
  };
}

/**
 * Verify the extraction of a document against expected data
 * @param {string} docxPath - Path to the Word document
 * @param {string} expectedJsonPath - Path to the expected JSON file
 * @param {Object} options - Options for processing
 * @param {string} options.provider - The LLM provider to use (e.g., 'openai', 'mock', 'claude')
 * @param {Object} options.llmOptions - Additional options to pass to the LLM
 * @returns {Promise<Object>} - Result with success flag and details
 */
async function verifyExtraction(docxPath, expectedJsonPath, options = {}) {
  console.log(`Verifying extraction for ${path.basename(docxPath)}`);
  
  try {
    // Process the document with the specified provider
    const processingOptions = {
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
    
    // Load the expected JSON data
    const expectedData = JSON.parse(await fs.promises.readFile(expectedJsonPath, 'utf8'));
    
    // Compare the actual extraction with expected data
    const comparisonResult = comparePersonObjects(extractionResult.data, expectedData);
    
    return {
      success: comparisonResult.success,
      docxPath,
      expectedJsonPath,
      differences: comparisonResult.differences,
      message: comparisonResult.success 
        ? `Verification passed for ${path.basename(docxPath)}`
        : `Verification failed for ${path.basename(docxPath)}`
    };
  } catch (error) {
    return {
      success: false,
      docxPath,
      expectedJsonPath,
      error: `Error during verification: ${error.message}`
    };
  }
}

/**
 * Run verification tests for all documents with matching expected JSON files
 * @param {string} docsDir - Directory containing documents to test
 * @param {Object} options - Options for processing
 * @param {string} options.provider - The LLM provider to use
 * @param {Object} options.llmOptions - Additional options to pass to the LLM
 * @returns {Promise<Array>} - Array of test results
 */
async function runVerificationTests(docsDir = './documents', options = {}) {
  const results = [];
  
  // Configure the document processor with the specified LLM if provided
  if (options.provider) {
    console.log(`Using LLM provider: ${options.provider}`);
    configureDocumentProcessor({ llmProvider: options.provider });
  }
  
  try {
    // Get all docx files in the documents directory and subdirectories
    const docxFiles = await findDocxFiles(docsDir);
    
    for (const docxPath of docxFiles) {
      // Generate the expected path for the corresponding expected JSON
      const expectedJsonPath = getExpectedJsonPath(docxPath);
      
      // Only test if the expected JSON file exists
      if (await fileExists(expectedJsonPath)) {
        const result = await verifyExtraction(docxPath, expectedJsonPath, options);
        results.push(result);
        
        // Log the result
        if (result.success) {
          console.log(`✅ ${result.message}`);
        } else {
          console.error(`❌ ${result.message}`);
          if (result.differences) {
            console.error('Differences:');
            result.differences.forEach(diff => console.error(`  - ${diff}`));
          }
        }
      }
    }
    
    // Print summary
    const passedCount = results.filter(r => r.success).length;
    console.log(`\nTest Summary: ${passedCount}/${results.length} tests passed`);
    
    return results;
  } catch (error) {
    console.error('Error running verification tests:', error);
    return [{ success: false, error: error.message }];
  }
}

/**
 * Find all .docx files in a directory and its subdirectories
 * @param {string} dir - Directory to search
 * @returns {Promise<Array<string>>} - Array of absolute file paths
 */
async function findDocxFiles(dir) {
  const files = [];
  const ignoreFolders = ['_Tests']; // Folders to ignore during traversal
  
  async function traverse(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip directories that are in the ignore list
        const dirName = entry.name;
        if (ignoreFolders.includes(dirName)) {
          console.log(`Skipping ignored directory: ${dirName}`);
          continue;
        }
        await traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.docx')) {
        files.push(fullPath);
      }
    }
  }
  
  await traverse(dir);
  return files;
}

/**
 * Get the expected JSON path for a docx file
 * This looks for a file with the same name but .expected.json extension
 * @param {string} docxPath - Path to the docx file
 * @returns {string} - Path to the expected JSON file
 */
function getExpectedJsonPath(docxPath) {
  const parsedPath = path.parse(docxPath);
  return path.join(parsedPath.dir, `${parsedPath.name}.expected.json`);
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - Whether the file exists
 */
async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Main function to run the tests
 */
async function main() {
  const args = process.argv.slice(2);
  let docsDir = './documents';
  let provider = null;
  let llmOptions = {};
  
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
    } else {
      // If it's not a flag, treat it as the directory path
      docsDir = args[i];
    }
  }
  
  console.log(`Starting verification tests in directory: ${docsDir}`);
  await runVerificationTests(docsDir, { provider, llmOptions });
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
  verifyExtraction,
  runVerificationTests,
  comparePersonObjects
};
