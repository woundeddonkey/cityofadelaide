import { LLMInterface } from './llm-interface.js';

/**
 * Anthropic Claude implementation of the LLM interface
 * Requires the '@anthropic-ai/sdk' package to be installed
 */
export class AnthropicLLM extends LLMInterface {
  constructor(options = {}) {
    super();
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = options.model || 'claude-3-opus-20240229';
    this.temperature = options.temperature !== undefined ? options.temperature : 0.1;
    this.maxTokens = options.maxTokens || 4096;
    
    // Dynamically import Anthropic SDK to avoid requiring it as a direct dependency
    this.anthropic = null;
    this.initializeAnthropic();
  }

  /**
   * Check if the Anthropic API key is properly configured
   * @returns {Object} - Result of the check with success flag
   */
  static checkAPIKey() {
    console.log('Checking Anthropic API key configuration...');
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('❌ ANTHROPIC_API_KEY environment variable is NOT set.');
      console.log('\nTo set the API key, run:');
      console.log('  export ANTHROPIC_API_KEY=your-api-key-here');
      
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY environment variable is not set'
      };
    }
    
    // Basic format validation for Anthropic keys
    if (!apiKey.startsWith('sk-ant-')) {
      console.error('❌ ANTHROPIC_API_KEY is set but does not match the expected format (should start with sk-ant-).');
      
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY has invalid format'
      };
    }
    
    console.log('✅ ANTHROPIC_API_KEY is set and has the correct format.');
    
    return { 
      success: true,
      message: 'Anthropic API key is properly configured'
    };
  }

  /**
   * Get the provider name
   * @returns {string} - Name of this provider
   */
  static getProviderName() {
    return "Claude";
  }

  /**
   * Initialize the Anthropic client
   * @private
   */
  async initializeAnthropic() {
    try {
      // Dynamic import of Anthropic SDK
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      // Create an Anthropic client
      this.anthropic = new Anthropic({
        apiKey: this.apiKey
      });
      
      console.log('Anthropic client initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize Anthropic client:', error.message);
      console.log('Make sure you have installed the @anthropic-ai/sdk package:');
      console.log('  npm install @anthropic-ai/sdk');
      
      throw new Error('Anthropic initialization failed. See error above.');
    }
  }

  /**
   * Send a prompt to the Anthropic Claude model and get a response
   * @param {string} prompt - The prompt to send to Claude
   * @param {Object} options - Optional parameters for the Claude call
   * @returns {Promise<string>} - The Claude response
   */
  async generateResponse(prompt, options = {}) {
    // Make sure the client is initialized
    if (!this.anthropic) {
      await this.initializeAnthropic();
    }
    
    // Configure options for this request
    const model = options.model || this.model;
    const temperature = options.temperature !== undefined ? options.temperature : this.temperature;
    const maxTokens = options.maxTokens || this.maxTokens;
    
    try {
      // Create the messages for Claude API
      const messages = [
        { role: 'user', content: prompt }
      ];
      
      // Call the Claude API
      const response = await this.anthropic.messages.create({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      });
      
      // Return the content of the response
      return response.content[0].text;
    } catch (error) {
      console.error('Error calling Anthropic Claude API:', error.message);
      throw new Error(`Claude API error: ${error.message}`);
    }
  }
}
