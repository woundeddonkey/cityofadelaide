/**
 * Base interface for LLM providers
 * This defines the common methods that all LLM implementations must provide
 */
export class LLMInterface {
  /**
   * Send a prompt to the LLM and get a response
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Object} options - Optional parameters for the LLM call
   * @returns {Promise<string>} - The LLM response
   */
  async generateResponse(prompt, options = {}) {
    throw new Error("Method 'generateResponse' must be implemented by subclasses");
  }

  /**
   * Generate a JSON response from the LLM
   * @param {string} prompt - The prompt to send to the LLM
   * @param {Object} options - Optional parameters for the LLM call
   * @returns {Promise<Object>} - The parsed JSON response
   */
  async generateJSON(prompt, options = {}) {
    const response = await this.generateResponse(prompt, { 
      ...options,
      responseFormat: 'json' 
    });
    return JSON.parse(response);
  }
  
  /**
   * Check if the required API key for this LLM provider is configured
   * Each provider should implement its own logic for checking API keys
   * @returns {Object} - Result with success flag and optional error message
   */
  static checkAPIKey() {
    // Default implementation for providers that don't need an API key
    return { 
      success: true,
      message: "No API key required for this provider"
    };
  }
  
  /**
   * Get the name of this LLM provider
   * @returns {string} - The name of the provider
   */
  static getProviderName() {
    return "Base LLM";
  }
}
