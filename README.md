# City of Adelaide Ship History Web Application

## 1. Project Overview

The City of Adelaide Ship History Web Application documents the histories and stories of families who traveled from England to Australia on the "City of Adelaide" ship during the 1800s. The application allows for the processing of historical documents, management of family records, tracking of voyages, and presentation of these in a maritime heritage-themed interface.

## 2. Architecture

### 2.1 Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Backend**: AWS Amplify
- **Authentication**: AWS Cognito (via Amplify Auth)
- **Database**: AWS AppSync/DynamoDB (via Amplify Data)
- **CI/CD**: AWS Amplify deployment pipeline

### 2.2 Architecture Overview

This project follows a modern serverless architecture pattern with clear separation of concerns:

1. **Presentation Layer**: React components in the `src/` directory
2. **Data Access Layer**: AWS Amplify Data queries/mutations
3. **Authentication Layer**: AWS Cognito with custom post-confirmation workflows
4. **Backend Definition**: Infrastructure-as-Code in the `amplify/` directory

### 2.3 Key Components

- **Amplify Backend**: Defined in `amplify/backend.ts`, configures auth and data resources
- **Data Schema**: Defined in `amplify/data/resource.ts`, contains GraphQL schema and access patterns
- **Authentication**: Configured in `amplify/auth/resource.ts` with post-confirmation triggers
- **Frontend Application**: Built in React with TypeScript using AWS Amplify UI components

## 3. Development Guidelines

### 3.1 Code Structure and Organization

- **Component Structure**: Follow a feature-based organization for components
- **TypeScript**: Use strong typing throughout the application
  - Define interfaces for all data models
  - Avoid using `any` type
- **State Management**: Use React hooks for state management
- **Amplify Schema**: Keep data models in the schema definition file
- **LLM Architecture**: Use the flexible LLM abstraction layer for document processing
- **Document Testing**: Use the test verification framework to ensure document extraction remains accurate over time

### 3.2 Coding Standards

- **Clean Code Principles**:
  - Functions should do one thing and do it well
  - Keep functions and components small and focused
  - Use meaningful variable and function names
  - Avoid deep nesting of conditionals and loops
- **TypeScript Standards**:
  - Use proper TypeScript interfaces for all data structures

## 4. Document Processing with LLM Architecture

The project includes a flexible Large Language Model (LLM) architecture for processing historical documents, with the following features:

### 4.1 Key Features

- **Multiple LLM Providers**: Support for OpenAI, Anthropic Claude, and easy extension to other providers
- **Mock Implementation**: Built-in mock LLM for testing and development
- **SOLID Principles**: Follows interface segregation and dependency inversion
- **Provider-Specific API Key Handling**: Each provider manages its own API validation
- **Factory Pattern**: LLM instances are created through a factory for better encapsulation

### 4.2 Usage

#### Processing Documents

Use the document processor script to process Word documents:

```bash
# Use the default mock LLM
node process-document.js path/to/document.docx

# Use OpenAI
node process-document.js path/to/document.docx --provider=openai

# Use Anthropic Claude
node process-document.js path/to/document.docx --provider=claude

# Check if an API key is configured for a provider
node process-document.js --check-api-key=openai
node process-document.js --check-api-key=claude

# Test a provider connection
node process-document.js --test-provider=openai
node process-document.js --test-provider=claude

# Show help
node process-document.js --help
```

### 4.3 LLM Architecture

The LLM system follows a clean architecture with these components:

- `src/utils/llm/llm-interface.js` - Abstract base class for all LLM providers
- `src/utils/llm/llm-factory.js` - Factory for creating and managing LLM instances
- `src/utils/llm/mock-llm.js` - Mock LLM for testing (no API key required)
- `src/utils/llm/openai-llm.js` - OpenAI implementation
- `src/utils/llm/anthropic-llm.js` - Anthropic Claude implementation
- `src/utils/llm/index.js` - Exports and provider registration system

```
LLMInterface (abstract)
    ├── MockLLM
    ├── OpenAILLM
    ├── AnthropicLLM
    └── (Future providers)
```

#### Extending with New Providers

To add a new LLM provider:

1. Create a new provider class that extends `LLMInterface`
2. Implement the required methods like `generateResponse()` and `generateJSON()`
3. Add static methods `checkAPIKey()` and `getProviderName()`
4. Register your provider in `src/utils/llm/index.js`

Example for adding a new "MyLLM" provider:

```javascript
// In src/utils/llm/my-llm.js
import { LLMInterface } from './llm-interface.js';

export class MyLLM extends LLMInterface {
  constructor(options = {}) {
    super();
    this.apiKey = options.apiKey || process.env.MY_LLM_API_KEY;
    // Initialize your provider
  }

  static checkAPIKey() {
    // Verify API key exists and is valid
    const apiKey = process.env.MY_LLM_API_KEY;
    return { 
      success: !!apiKey,
      message: apiKey ? "API key configured" : "API key missing"
    };
  }

  static getProviderName() {
    return "MyLLM";
  }

  async generateResponse(prompt, options = {}) {
    // Implement your provider's API call
  }
}

// In src/utils/llm/index.js
// Add registration function
const registerMyLLM = async () => {
  try {
    llmFactory.registerProvider('myllm', MyLLM, options => new MyLLM(options));
    return true;
  } catch (error) {
    console.warn('MyLLM provider could not be registered:', error.message);
    return false;
  }
};

// Update registerAllProviders
export const registerAllProviders = async () => {
  const results = {
    openai: await registerOpenAI(),
    claude: await registerAnthropic(),
    myllm: await registerMyLLM(),
  };
  return results;
};
```

### 4.4 API Configuration

LLM providers that require API keys need proper configuration:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your-api-key-here

# Set your Anthropic Claude API key
export ANTHROPIC_API_KEY=your-api-key-here

# For persistent configuration, add to your shell profile
echo 'export OPENAI_API_KEY=your-api-key-here' >> ~/.zshrc
echo 'export ANTHROPIC_API_KEY=your-api-key-here' >> ~/.zshrc
source ~/.zshrc
```

You can check API configuration and test connections with:

```bash
# Check if a specific provider's API key is configured properly
node process-document.js --check-api-key=openai
node process-document.js --check-api-key=claude

# Test a specific provider connection
node process-document.js --test-provider=openai
node process-document.js --test-provider=claude
```

#### Using the API in Your Code

```javascript
// Import the necessary components
import { processWordDocument, configureDocumentProcessor } from './src/utils/document-processor.js';
import { registerAllProviders } from './src/utils/llm/index.js';

// Initialize all providers
await registerAllProviders();

// Configure to use a specific provider
configureDocumentProcessor({ llmProvider: 'claude' });  // or 'openai', 'mock'

// Process a document
const result = await processWordDocument('path/to/document.docx', {
  // Provider-specific options
  llmOptions: {
    model: 'claude-3-opus-20240229',  // for Anthropic, or 'gpt-4o' for OpenAI
    temperature: 0.1
  }
});

// Use the extracted data
if (result.success) {
  console.log('Extracted data:', result.data);
}
```

#### Mock LLM for Testing

```javascript
import { MockLLM } from './src/utils/llm/mock-llm.js';
import { llmFactory } from './src/utils/llm/index.js';

// Create a custom mock with predefined responses
const mockLLM = new MockLLM({
  mockResponses: {
    "Extract person details": JSON.stringify({
      first_name: "John",
      last_name: "Smith"
    })
  },
  defaultResponse: "Default response"
});

// Use directly
const response = await mockLLM.generateResponse("Extract person details");

// Or register as a provider
llmFactory.registerProvider('custom-mock', MockLLM, 
  () => mockLLM);
```

## 5. Getting Started

### 5.1 Prerequisites

- Node.js (v18+)
- npm or yarn
- AWS Account with appropriate permissions (for Amplify features)
- Amplify CLI (for backend changes)

### 5.2 Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. For backend changes, use Amplify CLI

### 5.3 Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build production version
- `npm run lint`: Run ESLint
- `npm run typecheck`: Run TypeScript type checking

## 6. Document Processing and Testing

The application includes a document processing system that extracts information from historical documents (primarily Word documents) and converts them into structured data.

### 6.1 Document Processor

The document processor (`src/utils/document-processor.js`) is responsible for:

1. Extracting raw text from Word documents using the `mammoth` library
2. Saving the extracted text in the same folder as the original document
3. Using LLM-based extraction to identify person details from the text
4. Saving the extracted JSON data alongside the original document

### 6.2 Testing Document Extraction

To ensure the accuracy of document extraction, we've implemented a test verification framework:

#### Creating Expected JSON Files

You can create template expected JSON files using the `generate-expected-json.js` script:

```bash
# Use the default provider (mock)
node generate-expected-json.js /path/to/document.docx

# Specify a specific LLM provider
node generate-expected-json.js --provider openai /path/to/document.docx

# Or use the npm script
npm run generate:expected -- /path/to/document.docx
npm run generate:expected:openai -- /path/to/document.docx
npm run generate:expected:claude -- /path/to/document.docx
```

This will process the document and create a `.expected.json` file in the same folder. You can then edit this file to represent the correct expected output.

#### Running Verification Tests

To verify document extraction against expected JSON files:

```bash
# Use the default provider
node test-extraction-verification.js

# Specify a specific LLM provider
node test-extraction-verification.js --provider openai

# With npm scripts
npm run test:extraction
npm run test:extraction:openai
npm run test:extraction:claude
```

This script will:
1. Find all `.docx` files in the documents directory (excluding the `_Tests` folder)
2. Look for matching `.expected.json` files
3. Process each document and compare the extraction results with the expected output
4. Report any differences or discrepancies

Optionally, you can specify a specific directory to test:

```bash
node test-extraction-verification.js ./documents/Specific_Family
```

#### Custom Test Configuration

For more advanced testing needs, you can use the custom test script that allows specifying directories to include or exclude:

```bash
# Exclude specific directories (default excludes _Tests)
node test-custom-extraction.js --exclude "_Tests,Ahun,Baker"

# Include only specific directories
node test-custom-extraction.js --include "Cheadle,Frame,Fox"

# Combine with provider selection
node test-custom-extraction.js --provider openai --include "Cheadle,Frame"
```

With npm scripts:
```bash
npm run test:custom -- --exclude "_Tests,Ahun"
npm run test:custom -- --include "Frame,Cheadle" --provider openai
```

The custom test script gives you more control over which document folders are processed during testing.

#### Test Result Interpretation

The test framework reports:
- Missing fields that were expected but not extracted
- Value mismatches between expected and actual data
- Nested object differences
- Overall test success/failure statistics

These tests should be run before making changes to the extraction system to ensure that existing functionality isn't broken.
