#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processWordDocument, configureDocumentProcessor } from './src/utils/document-processor.js';
import { verifyExtraction, comparePersonObjects } from './test-extraction-verification.js';

/**
 * Find all .docx files in a directory and its subdirectories
 * @param {string} dir - Directory to search
 * @param {Object} options - Search options
 * @param {Array<string>} options.excludeDirs - List of directory names to exclude
 * @param {Array<string>} options.includeDirs - List of directory names to include (if empty, include all except excluded)
 * @returns {Promise<Array<string>>} - Array of absolute file paths
 */
async function findDocxFiles(dir, options = {}) {
  const files = [];
  const excludeDirs = options.excludeDirs || ['_Tests']; // Default to excluding _Tests
  const includeDirs = options.includeDirs || []; // Default to including all non-excluded dirs
  
  async function traverse(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip directories that are in the exclude list
        const dirName = entry.name;
        if (excludeDirs.includes(dirName)) {
          console.log(`Skipping excluded directory: ${dirName}`);
          continue;
        }
        
        // If includeDirs is specified, only traverse directories in the list
        if (includeDirs.length > 0) {
          const baseName = path.basename(currentDir);
          // Include if the current directory is in the include list, or any parent directory is
          if (includeDirs.includes(dirName) || includeDirs.includes(baseName)) {
            await traverse(fullPath);
          }
        } else {
          // No specific includes, so traverse all non-excluded directories
          await traverse(fullPath);
        }
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
 * Run verification tests with custom directory filtering
 * @param {Object} options - Options for testing
 * @param {string} options.docsDir - Base directory for documents
 * @param {Array<string>} options.excludeDirs - List of directory names to exclude
 * @param {Array<string>} options.includeDirs - List of directory names to include
 * @param {string} options.provider - LLM provider to use
 * @param {Object} options.llmOptions - Options for the LLM
 * @returns {Promise<Array>} - Array of test results
 */
async function runCustomVerificationTests(options = {}) {
  const {
    docsDir = './documents',
    excludeDirs = ['_Tests'],
    includeDirs = [],
    provider,
    llmOptions = {}
  } = options;
  
  const results = [];
  
  // Configure the document processor with the specified LLM if provided
  if (provider) {
    console.log(`Using LLM provider: ${provider}`);
    configureDocumentProcessor({ llmProvider: provider });
  }
  
  try {
    console.log(`Starting verification tests in directory: ${docsDir}`);
    if (excludeDirs.length > 0) {
      console.log(`Excluding directories: ${excludeDirs.join(', ')}`);
    }
    if (includeDirs.length > 0) {
      console.log(`Including only directories: ${includeDirs.join(', ')}`);
    }
    
    // Get all docx files using custom filtering
    const docxFiles = await findDocxFiles(docsDir, { excludeDirs, includeDirs });
    console.log(`Found ${docxFiles.length} .docx files to test`);
    
    for (const docxPath of docxFiles) {
      // Generate the expected path for the corresponding expected JSON
      const expectedJsonPath = getExpectedJsonPath(docxPath);
      
      // Only test if the expected JSON file exists
      if (await fileExists(expectedJsonPath)) {
        const processingOptions = {
          provider,
          llmOptions: llmOptions || {}
        };
        
        console.log(`Testing extraction for ${path.basename(docxPath)}`);
        const extractionResult = await processWordDocument(docxPath, processingOptions);
        
        if (!extractionResult.success) {
          const result = {
            success: false,
            docxPath,
            expectedJsonPath,
            error: `Extraction failed: ${extractionResult.error}`,
            message: `Extraction failed for ${path.basename(docxPath)}`
          };
          results.push(result);
          console.error(`❌ ${result.message}`);
          continue;
        }
        
        // Load the expected JSON data
        const expectedData = JSON.parse(await fs.promises.readFile(expectedJsonPath, 'utf8'));
        
        // Compare the actual extraction with expected data
        const comparisonResult = comparePersonObjects(extractionResult.data, expectedData);
        
        const result = {
          success: comparisonResult.success,
          docxPath,
          expectedJsonPath,
          differences: comparisonResult.differences,
          message: comparisonResult.success 
            ? `Verification passed for ${path.basename(docxPath)}`
            : `Verification failed for ${path.basename(docxPath)}`
        };
        
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
      } else {
        console.log(`Skipping ${path.basename(docxPath)}: No matching .expected.json file found`);
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
 * Main function to run the tests
 */
async function main() {
  const args = process.argv.slice(2);
  let docsDir = './documents';
  let provider = null;
  let llmOptions = {};
  let excludeDirs = ['_Tests']; // Default to excluding _Tests
  let includeDirs = []; // Default to including all non-excluded
  
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
    } else if (args[i] === '--exclude' && i + 1 < args.length) {
      excludeDirs = args[i + 1].split(',');
      i++; // Skip the next argument
    } else if (args[i] === '--include' && i + 1 < args.length) {
      includeDirs = args[i + 1].split(',');
      i++; // Skip the next argument
    } else {
      // If it's not a flag, treat it as the directory path
      docsDir = args[i];
    }
  }
  
  await runCustomVerificationTests({
    docsDir,
    provider,
    llmOptions,
    excludeDirs,
    includeDirs
  });
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
  runCustomVerificationTests,
  findDocxFiles
};
