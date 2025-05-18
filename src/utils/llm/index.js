import { llmFactory } from './llm-factory.js';
import { MockLLM } from './mock-llm.js';
import { LLMInterface } from './llm-interface.js';

// Lazy-load the OpenAI provider to avoid requiring it as a direct dependency
const registerOpenAI = async () => {
  try {
    const { OpenAILLM } = await import('./openai-llm.js');
    
    // Register the provider with both the class and factory method
    llmFactory.registerProvider('openai', OpenAILLM, options => new OpenAILLM(options));
    return true;
  } catch (error) {
    console.warn('OpenAI provider could not be registered:', error.message);
    return false;
  }
};

// Lazy-load the Anthropic/Claude provider
const registerAnthropic = async () => {
  try {
    const { AnthropicLLM } = await import('./anthropic-llm.js');
    
    // Register the provider with both the class and factory method
    llmFactory.registerProvider('claude', AnthropicLLM, options => new AnthropicLLM(options));
    return true;
  } catch (error) {
    console.warn('Anthropic Claude provider could not be registered:', error.message);
    return false;
  }
};

// Register the MockLLM provider
// This is already done in the constructor, but we do it again here for consistency
llmFactory.registerProvider('mock', MockLLM, options => new MockLLM(options));

// Export all the LLM components
export { 
  llmFactory, 
  LLMInterface, 
  MockLLM 
};

// Optional: Expose a helper function to register all providers
export const registerAllProviders = async () => {
  const results = {
    openai: await registerOpenAI(),
    claude: await registerAnthropic(),
    // Add other providers here as they become available
  };
  
  return results;
};

/**
 * Get a list of all available LLM providers
 * @returns {Array<string>} - Array of provider names
 */
export const getAvailableProviders = () => {
  return llmFactory.getProviders();
};

/**
 * Check if a provider's API key is properly configured
 * @param {string} providerName - Name of the provider to check
 * @returns {Object} - Result with success flag and message
 */
export const checkProviderAPIKey = (providerName) => {
  return llmFactory.checkAPIKey(providerName);
};
