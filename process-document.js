#!/usr/bin/env node

/**
 * CLI tool to process Word documents and extract person information
 * 
 * Usage:
 *   node process-document.js [path/to/document.docx] [--provider=<provider>]
 * 
 * Options:
 *   --provider=<provider>       Specify the LLM provider to use (mock, openai)
 *   --check-api-key[=provider]  Check if the API key for a provider is configured
 *   --test-provider=<provider>  Test the connection to a specific provider
 *   --help                      Show help
 * 
 * If no document path is provided, a sample document will be used.
 */

import { processWordDocument, getSampleDocumentPath, configureDocumentProcessor } from './src/utils/document-processor.js';
import { registerAllProviders, checkProviderAPIKey, getAvailableProviders, llmFactory } from './src/utils/llm/index.js';
import fs from 'fs';
import path from 'path';

/**
 * Check if the API key for a specific provider is configured and valid
 * @param {string} provider - The provider to check
 */
async function checkAPIKey(provider = 'openai') {
  try {
    // Initialize all providers first
    await registerAllProviders();
    
    console.log(`Checking API key for ${provider} provider...`);
    const result = checkProviderAPIKey(provider);
    
    if (result.success) {
      console.log(`\nTo use ${provider} for document processing, run:`);
      console.log(`  node process-document.js --provider=${provider}`);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error checking API key:', error.message);
    process.exit(1);
  }
}

/**
 * Test the connection to a specific LLM provider
 * @param {string} provider - The provider to test
 */
async function testProviderConnection(provider = 'openai') {
  try {
    // First check if the API key is configured
    await checkAPIKey(provider);
    
    console.log(`Testing ${provider} connection...`);
    
    // Initialize providers
    await registerAllProviders();
    
    // Create an instance of the provider using the factory
    const llm = llmFactory.create(provider);
    
    // Try to generate a simple response
    console.log(`Sending test request to ${provider}...`);
    const response = await llm.generateResponse('Say hello world');
    
    console.log(`✅ ${provider} connection successful!`);
    console.log('Response:', response);
    
    // Provide command example
    console.log(`\nTo process documents with ${provider}, run:`);
    console.log(`  node process-document.js --provider=${provider}`);
  } catch (error) {
    console.error(`❌ ${provider} connection test failed:`, error.message);
    console.error('\nPlease check your API key and internet connection.');
    process.exit(1);
  }
}

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
      } else if (arg.startsWith('--check-api-key')) {
        const parts = arg.split('=');
        const checkProvider = parts.length > 1 ? parts[1] : 'openai';
        await checkAPIKey(checkProvider);
        return;
      } else if (arg.startsWith('--test-provider=')) {
        const testProvider = arg.split('=')[1];
        await testProviderConnection(testProvider);
        return;
      } else if (arg === '--test-openai') {
        // Legacy support for --test-openai
        await testProviderConnection('openai');
        return;
      } else if (!arg.startsWith('--')) {
        docPath = arg;
      }
    }
    
    if (showHelp) {
      console.log(`
Usage:
  node process-document.js [path/to/document.docx] [--provider=<provider>]

Options:
  --provider=<provider>       Specify the LLM provider to use (mock, openai)
  --check-api-key[=provider]  Check if the API key for a provider is configured
  --test-provider=<provider>  Test the connection to a specific provider
  --help                      Show help
      `);
      process.exit(0);
    }
    
    // Initialize all available LLM providers
    console.log('Initializing LLM providers...');
    await registerAllProviders();
    
    // Check if the selected provider has a valid API key
    if (provider !== 'mock') {
      const keyCheck = checkProviderAPIKey(provider);
      if (!keyCheck.success) {
        console.error(`Error: API key for ${provider} is not properly configured.`);
        console.error(keyCheck.error || 'Please check your environment variables.');
        process.exit(1);
      }
    }
    
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
    const result = await processWordDocument(docPath, {
      provider: provider
    });
    
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
