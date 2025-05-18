#!/usr/bin/env node

/**
 * Test script to extract people from a document and display the raw LLM response
 * 
 * Usage:
 *   node test-extraction.js [path/to/document.docx] [--provider=<provider>]
 */

import { processWordDocument, getSampleDocumentPath, configureDocumentProcessor } from './src/utils/document-processor.js';
import { registerAllProviders, llmFactory } from './src/utils/llm/index.js';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PERSON_EXTRACTION_PROMPT } from './src/prompts/person-extraction-prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let docPath = null;
    let provider = 'openai';
    
    // Parse arguments
    for (const arg of args) {
      if (arg.startsWith('--provider=')) {
        provider = arg.split('=')[1];
      } else if (!arg.startsWith('--')) {
        docPath = arg;
      }
    }
    
    // Initialize all available LLM providers
    console.log('Initializing LLM providers...');
    await registerAllProviders();
    
    // Configure the document processor to use the specified provider
    configureDocumentProcessor({ llmProvider: provider });
    console.log(`Using LLM provider: ${provider}`);
    
    // Get document path or use sample
    if (!docPath) {
      docPath = 'documents/Baker/Family Tree of Bridget Baker.docx';
      console.log(`No document path provided. Using: ${docPath}`);
    }
    
    // Ensure the file exists
    if (!fs.existsSync(docPath)) {
      console.error(`Error: Document not found at ${docPath}`);
      process.exit(1);
    }
    
    // Process the document
    console.log(`Processing document: ${docPath}`);
    
    // 1. Extract text from Word document
    const { value: docText } = await mammoth.extractRawText({ path: docPath });
    
    // 2. Create an LLM instance
    const llm = llmFactory.create(provider);
    
    // 3. Prepare the prompt
    const prompt = PERSON_EXTRACTION_PROMPT.replace('[DOCUMENT_TEXT]', docText);
    
    // 4. Get raw response from LLM
    console.log(`\nCalling LLM (${provider} provider) to extract persons data...`);
    const rawResponse = await llm.generateResponse(prompt, {
      systemPrompt: 'You are a specialized assistant for extracting historical biographical information. Output valid JSON array only.'
    });
    
    // 5. Display the raw response
    console.log('\nRaw LLM Response:');
    console.log(rawResponse);
    
    // 6. Try to parse as JSON
    try {
      const parsedData = JSON.parse(rawResponse);
      console.log('\nParsed as JSON successfully:');
      console.log('Data type:', Array.isArray(parsedData) ? 'Array' : typeof parsedData);
      
      if (Array.isArray(parsedData)) {
        console.log(`Array contains ${parsedData.length} items`);
      }
      
      console.log('\nParsed data:');
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (error) {
      console.error('\nFailed to parse response as JSON:', error.message);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
