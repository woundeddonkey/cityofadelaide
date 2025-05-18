import { LLMInterface } from './llm-interface.js';
import fs from 'fs';
import path from 'path';

/**
 * Mock implementation of the LLM interface for testing purposes
 * This allows returning canned responses for testing
 */
export class MockLLM extends LLMInterface {
  constructor(options = {}) {
    super();
    this.mockResponses = options.mockResponses || {};
    this.defaultResponse = options.defaultResponse || null;
    this.recordMode = options.recordMode || false;
    this.recordDir = options.recordDir || null;
  }

  /**
   * Check if API key is configured - always returns true for the mock provider
   * since no API key is required
   * @returns {Object} - Success result since no API key is needed
   */
  static checkAPIKey() {
    return {
      success: true,
      message: "No API key required for mock LLM provider"
    };
  }
  
  /**
   * Get the provider name
   * @returns {string} - Name of this provider
   */
  static getProviderName() {
    return "Mock";
  }

  /**
   * Generate a mocked response
   * @param {string} prompt - The prompt to match for a mocked response
   * @param {Object} options - Options for the LLM call
   * @returns {Promise<string>} - The mocked response
   */
  async generateResponse(prompt, options = {}) {
    console.log('MockLLM received prompt:', prompt.substring(0, 100) + '...');
    
    // If we have a direct mock for this prompt, return it
    if (this.mockResponses[prompt]) {
      return this.mockResponses[prompt];
    }
    
    // If we're in record mode and have a real LLM configured, record the response
    if (this.recordMode && options.realLLM && this.recordDir) {
      const response = await options.realLLM.generateResponse(prompt, options);
      this.recordResponse(prompt, response);
      return response;
    }
    
    // Return the default response if no specific mock is found
    if (this.defaultResponse) {
      return this.defaultResponse;
    }
    
    // Create a mock person response as a fallback
    return JSON.stringify({
      first_name: "John",
      middle_names: "William",
      last_name: "Smith",
      gender: "Male",
      birth_date: "1850-03-15",
      birth_place: "London, England",
      death_date: "1920-11-23",
      death_place: "Adelaide, Australia",
      age_at_death: "70 years",
      burial_place: "Adelaide Cemetery"
    });
  }

  /**
   * Record a response to a file for future use
   * @param {string} prompt - The prompt that generated the response
   * @param {string} response - The response to record
   */
  recordResponse(prompt, response) {
    if (!this.recordDir) return;
    
    try {
      // Create a hash of the prompt to use as a filename
      const hash = Buffer.from(prompt).toString('base64').substring(0, 20);
      const filename = `mock_response_${hash}.json`;
      const filePath = path.join(this.recordDir, filename);
      
      // Write the prompt and response to a file
      fs.writeFileSync(filePath, JSON.stringify({
        prompt,
        response,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      console.log(`Recorded mock response to ${filePath}`);
    } catch (error) {
      console.error('Error recording mock response:', error);
    }
  }

  /**
   * Load mock responses from a directory
   * @param {string} directory - The directory containing mock response files
   */
  loadMockResponses(directory) {
    try {
      const files = fs.readdirSync(directory);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(directory, file);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          this.mockResponses[data.prompt] = data.response;
        }
      });
      console.log(`Loaded ${Object.keys(this.mockResponses).length} mock responses`);
    } catch (error) {
      console.error('Error loading mock responses:', error);
    }
  }
}
