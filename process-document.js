#!/usr/bin/env node

/**
 * CLI tool to process Word documents and extract person information
 * 
 * Usage:
 *   node process-document.js [path/to/document.docx] [--provider=<provider>]
 * 
 * Options:
 *   --provider=<provider>  Specify the LLM provider to use (mock, openai)
 *   --help                 Show help
 * 
 * If no document path is provided, a sample document will be used.
 */

import { processWordDocument, getSampleDocumentPath, configureDocumentProcessor } from './src/utils/document-processor.js';
import { registerAllProviders } from './src/utils/llm/index.js';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let docPath = null;
    let provider = 'mock';
    let showHelp = false;
    
    // Parse arguments
    for (const arg of args) {
      if (arg.startsWith('--provider=')) {
        provider = arg.split('=')[1];
      } else if (arg === '--help') {
        showHelp = true;
      } else if (!arg.startsWith('--')) {
        docPath = arg;
      }
    }
    
    if (showHelp) {
      console.log(`
Usage:
  node process-document.js [path/to/document.docx] [--provider=<provider>]

Options:
  --provider=<provider>  Specify the LLM provider to use (mock, openai)
  --help                 Show help
      `);
      process.exit(0);
    }
    
    // Initialize all available LLM providers
    console.log('Initializing LLM providers...');
    await registerAllProviders();
    
    // Configure the document processor to use the specified provider
    configureDocumentProcessor({ llmProvider: provider });
    console.log(`Using LLM provider: ${provider}`);
    
    // Get document path or use sample
    if (!docPath) {
      docPath = getSampleDocumentPath();
      console.log(`No document path provided. Using sample: ${docPath}`);
    }
    
    // Ensure the file exists
    if (!fs.existsSync(docPath)) {
      console.error(`Error: Document not found at ${docPath}`);
      process.exit(1);
    }
    
    // Process the document
    console.log(`Processing document: ${docPath}`);
    const result = await processWordDocument(docPath);
    
    // Display the results
    if (result.success) {
      console.log('\nExtracted Person Data:');
      console.log(JSON.stringify(result.data, null, 2));
      
      // Save the result to a JSON file in the same directory as the Word document
      const outputDir = path.dirname(docPath);
      const baseName = path.basename(docPath, path.extname(docPath));
      const outputPath = path.join(outputDir, `${baseName}.json`);
      
      fs.writeFileSync(outputPath, JSON.stringify(result.data, null, 2));
      console.log(`\nSaved extracted data to: ${outputPath}`);
    } else {
      console.error('\nError processing document:');
      console.error(result.error || 'Unknown error');
      
      if (result.errors) {
        console.error('\nValidation errors:');
        console.error(result.errors);
      }
      
      if (result.data) {
        console.log('\nPartial data (invalid):');
        console.log(JSON.stringify(result.data, null, 2));
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();