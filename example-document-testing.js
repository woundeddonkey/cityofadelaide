#!/usr/bin/env node
import { processWordDocument, configureDocumentProcessor } from './src/utils/document-processor.js';
import { verifyExtraction } from './test-extraction-verification.js';
import { generateExpectedJson } from './generate-expected-json.js';
import path from 'path';

/**
 * Example script showing how to use the document processor and testing functionality
 * @param {string} provider - The LLM provider to use ('mock', 'openai', 'claude')
 */
async function runExample(provider = 'mock') {
  try {
    console.log(`Using LLM provider: ${provider}`);
    
    // Configure the document processor with the specified LLM
    configureDocumentProcessor({ llmProvider: provider });
    
    // 1. Process a sample document
    console.log('Step 1: Processing a sample document');
    const sampleDocPath = '/Users/richardcrawford/projects/cityofadelaide/documents/_Tests/PersonDetails.docx';
    const result = await processWordDocument(sampleDocPath, { provider });
    
    if (result.success) {
      console.log('✅ Document processed successfully');
      console.log(`Extracted text saved to: ${result.textFilePath}`);
      console.log(`Extraction results saved to: ${result.jsonFilePath}`);
    } else {
      console.error('❌ Document processing failed:', result.error);
      return;
    }
    
    // 2. Generate expected JSON for testing
    console.log('\nStep 2: Generating expected JSON (normally would be manually edited)');
    const genResult = await generateExpectedJson(sampleDocPath, { provider });
    
    if (genResult.success) {
      console.log(`✅ Expected JSON generated at: ${genResult.expectedJsonPath}`);
    } else {
      console.error('❌ Expected JSON generation failed:', genResult.error);
      return;
    }
    
    // 3. Verify extraction against expected JSON
    console.log('\nStep 3: Verifying extraction against expected JSON');
    const expectedJsonPath = path.join(path.dirname(sampleDocPath), `${path.basename(sampleDocPath, '.docx')}.expected.json`);
    const verifyResult = await verifyExtraction(sampleDocPath, expectedJsonPath, { provider });
    
    if (verifyResult.success) {
      console.log(`✅ Verification successful: ${verifyResult.message}`);
    } else {
      console.error(`❌ Verification failed: ${verifyResult.message}`);
      if (verifyResult.differences) {
        console.error('Differences:');
        verifyResult.differences.forEach(diff => console.error(`  - ${diff}`));
      }
    }
    
    console.log('\nExample completed. You can use the following npm scripts for your own testing:');
    console.log('- npm run test:extraction -- --provider openai            # Test with OpenAI');
    console.log('- npm run generate:expected -- --provider claude my-doc.docx  # Generate with Claude');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let provider = 'mock'; // Default provider

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--provider' && i + 1 < args.length) {
    provider = args[i + 1];
    i++; // Skip the next argument
  }
}

// Run the example if this script is executed directly
runExample(provider).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
