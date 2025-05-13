#!/usr/bin/env node

/**
 * CLI tool to process Word documents and extract person information
 * 
 * Usage:
 *   node process-document.js [path/to/document.docx]
 * 
 * If no document path is provided, a sample document will be used.
 */

import { processWordDocument, getSampleDocumentPath } from './src/utils/document-processor.js';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    // Get document path from command line or use sample
    let docPath = process.argv[2];
    
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