#!/usr/bin/env node

/**
 * Test script to extract people from a document and display the raw LLM response
 * 
 * Usage:
 *   node test-direct-extraction.js [path/to/document.docx] [--provider=<provider>]
 */

import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';
import { PERSON_EXTRACTION_PROMPT } from './src/prompts/person-extraction-prompt.js';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  process.exit(1);
}

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let docPath = null;
    
    // Parse arguments
    for (const arg of args) {
      if (!arg.startsWith('--')) {
        docPath = arg;
      }
    }
    
    // Get document path or use default
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
    console.log(`Document text length: ${docText.length} characters`);
    
    // 2. Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // 3. Prepare the prompt
    const prompt = PERSON_EXTRACTION_PROMPT.replace('[DOCUMENT_TEXT]', docText);
    
    // 4. Get raw response from OpenAI
    console.log(`\nCalling OpenAI to extract persons data...`);
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a specialized assistant for extracting historical biographical information. Your output should ALWAYS be a valid JSON array of person objects, even if there's only one person."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    // 5. Display the raw response
    console.log('\nOpenAI Response:');
    const rawContent = response.choices[0].message.content;
    console.log(rawContent);
    
    // 6. Try to parse as JSON
    try {
      const parsedData = JSON.parse(rawContent);
      console.log('\nParsed as JSON successfully:');
      
      // Extract the array from the response (which might be wrapped in another object)
      let personsArray;
      if (Array.isArray(parsedData)) {
        personsArray = parsedData;
      } else if (parsedData.persons && Array.isArray(parsedData.persons)) {
        personsArray = parsedData.persons;
      } else if (parsedData.data && Array.isArray(parsedData.data)) {
        personsArray = parsedData.data;
      } else if (parsedData.people && Array.isArray(parsedData.people)) {
        personsArray = parsedData.people;
      } else {
        // If we can't find an array, wrap the single object in an array
        personsArray = [parsedData];
      }
      
      console.log(`Found ${personsArray.length} person(s) in the data`);
      
      console.log('\nExtracted persons:');
      console.log(JSON.stringify(personsArray, null, 2));
    } catch (error) {
      console.error('\nFailed to parse response as JSON:', error.message);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
