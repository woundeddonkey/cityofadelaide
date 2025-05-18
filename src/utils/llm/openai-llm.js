import { LLMInterface } from './llm-interface.js';

/**
 * OpenAI API implementation of the LLM interface
 * Requires the 'openai' package to be installed
 */
export class OpenAILLM extends LLMInterface {
  constructor(options = {}) {
    super();
    this.apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    this.model = options.model || 'gpt-4o';
    this.temperature = options.temperature !== undefined ? options.temperature : 0.1;
    this.maxTokens = options.maxTokens || 2048;
    
    // Dynamically import OpenAI to avoid requiring it as a direct dependency
    this.openai = null;
    this.initializeOpenAI();
  }

  /**
 * Check if the OpenAI API key is properly configured
 * @returns {Object} - Result of the check with success flag
 */
static checkAPIKey() {
  console.log('Checking OpenAI API key configuration...');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is NOT set.');
    console.log('\nTo set the API key, run:');
    console.log('  export OPENAI_API_KEY=your-api-key-here');
    
    return {
      success: false,
      error: 'OPENAI_API_KEY environment variable is not set'
    };
  }
  
  // Basic format validation for OpenAI keys
  if (!apiKey.startsWith('sk-')) {
    console.error('❌ OPENAI_API_KEY is set but does not match the expected format (should start with sk-).');
    
    return {
      success: false,
      error: 'OPENAI_API_KEY has invalid format'
    };
  }
  
  console.log('✅ OPENAI_API_KEY is set and has the correct format.');
  
  return { 
    success: true,
    message: 'OpenAI API key is properly configured'
  };
}

/**
 * Get the provider name
 * @returns {string} - Name of this provider
 */
static getProviderName() {
  return "OpenAI";
}

/**
 * Initialize the OpenAI client
   * @private
   */
  async initializeOpenAI() {
    try {
      // Dynamically import the OpenAI package
      const { OpenAI } = await import('openai');
      
      if (!this.apiKey) {
        throw new Error('OpenAI API key is required. Set it in the constructor options or as OPENAI_API_KEY environment variable.');
      }
      
      this.openai = new OpenAI({
        apiKey: this.apiKey
      });
      
    } catch (error) {
      console.error('Error initializing OpenAI client:', error);
      throw new Error(`Failed to initialize OpenAI client. Make sure the 'openai' package is installed: npm install openai`);
    }
  }

  /**
   * Generate a response from OpenAI
   * @param {string} prompt - The prompt to send to OpenAI
   * @param {Object} options - Options for the OpenAI call
   * @returns {Promise<string>} - The OpenAI response
   */
  async generateResponse(prompt, options = {}) {
    // Make sure the client is initialized
    if (!this.openai) {
      await this.initializeOpenAI();
    }
    
    try {
      // Create the request with all parameters
      const requestOptions = {
        model: options.model || this.model,
        temperature: options.temperature !== undefined ? options.temperature : this.temperature,
        max_tokens: options.maxTokens || this.maxTokens,
        messages: [
          { role: 'system', content: options.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ]
      };
      
      // Add response format if specified
      if (options.responseFormat === 'json') {
        requestOptions.response_format = { type: 'json_object' };
      }
      
      // Call the OpenAI API
      const response = await this.openai.chat.completions.create(requestOptions);
      
      // Return the response content
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response from OpenAI:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}
