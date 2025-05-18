import { MockLLM } from './mock-llm.js';

/**
 * Factory class for creating LLM instances
 * This makes it easy to switch between different LLM providers
 */
export class LLMFactory {
  constructor() {
    this.providers = {};
    this.providerClasses = {};
    this.defaultProvider = null;
    
    // Register the built-in mock provider
    this.registerProvider('mock', MockLLM, options => new MockLLM(options));
  }

  /**
   * Register a new LLM provider
   * @param {string} name - The name of the provider
   * @param {Class} providerClass - The provider class for static methods
   * @param {Function} factory - A factory function that creates a provider instance
   */
  registerProvider(name, providerClass, factory) {
    this.providers[name] = factory;
    this.providerClasses[name] = providerClass;
    
    // If this is the first provider, make it the default
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  /**
   * Set the default LLM provider
   * @param {string} name - The name of the provider to use as default
   */
  setDefaultProvider(name) {
    if (!this.providers[name]) {
      throw new Error(`Provider '${name}' is not registered`);
    }
    this.defaultProvider = name;
  }

  /**
   * Check if a specific provider's API key is properly configured
   * @param {string} name - The name of the provider to check
   * @returns {Object} - Result with success flag and optional error message
   */
  checkAPIKey(name) {
    const providerClass = this.providerClasses[name];
    if (!providerClass) {
      throw new Error(`Provider '${name}' is not registered`);
    }
    
    return providerClass.checkAPIKey();
  }

  /**
   * Get the display name of a provider
   * @param {string} name - The registered name of the provider
   * @returns {string} - The display name of the provider
   */
  getProviderName(name) {
    const providerClass = this.providerClasses[name];
    if (!providerClass) {
      return name; // Fallback to the registered name
    }
    
    return providerClass.getProviderName();
  }

  /**
   * Create an LLM instance
   * @param {string} name - The name of the provider to create (uses default if not specified)
   * @param {Object} options - Options to pass to the provider factory
   * @returns {Object} - An LLM instance
   */
  create(name = null, options = {}) {
    const providerName = name || this.defaultProvider;
    
    if (!providerName) {
      throw new Error('No LLM provider is registered');
    }
    
    if (!this.providers[providerName]) {
      throw new Error(`Provider '${providerName}' is not registered`);
    }
    
    return this.providers[providerName](options);
  }
  
  /**
   * Get a list of all registered providers
   * @returns {Array} - Array of provider names
   */
  getProviders() {
    return Object.keys(this.providers);
  }
}

// Create and export a singleton instance
export const llmFactory = new LLMFactory();
