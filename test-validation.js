#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Validator } from 'jsonschema';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the test file
const testDataPath = path.join(__dirname, 'documents', '_Tests', 'MultiplePersons.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));

// Read the schema files
const personsSchemaPath = path.join(__dirname, 'src', 'schemas', 'persons-schema.json');
const personsSchema = JSON.parse(fs.readFileSync(personsSchemaPath, 'utf8'));

// Validate the test data
const validator = new Validator();
const result = validator.validate(testData, personsSchema);

console.log('Test data:', JSON.stringify(testData, null, 2));
console.log('\nValidation result:', result.valid);

if (!result.valid) {
  console.log('Errors:', JSON.stringify(result.errors, null, 2));
} else {
  console.log('Validation successful!');
}
