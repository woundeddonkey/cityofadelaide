
/**
 * Extracts valid JSON from a text string that might contain Markdown formatting, code blocks, etc.
 * @param {string} text - The text to extract JSON from
 * @returns {object|array|null} - The parsed JSON data, or null if no valid JSON was found
 */
export function extractJsonFromText(text) {
  if (!text) return null;
  
  try {
    // First try parsing the entire text as JSON
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try to extract JSON from the text
    try {
      // Remove markdown code blocks if present
      let cleaned = text;
      
      // Handle markdown code blocks
      if (cleaned.includes('```')) {
        // Extract content between ```json and ``` markers
        const codeBlockMatches = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatches && codeBlockMatches[1]) {
          cleaned = codeBlockMatches[1].trim();
        } else {
          // Try to remove the markers
          cleaned = cleaned.replace(/```json\s*/g, '');
          cleaned = cleaned.replace(/```\s*/g, '');
        }
      }
      
      // If we have what looks like the start of a JSON object or array, 
      // try to find the matching end
      if (cleaned.trim().startsWith('{')) {
        // Extract everything from the first { to the last }
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } else if (cleaned.trim().startsWith('[')) {
        // Extract everything from the first [ to the last ]
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          return JSON.parse(match[0]);
        }
      }
      
      // If we get here, we couldn't extract valid JSON
      return null;
    } catch (e2) {
      // If all extraction attempts failed
      console.error('Failed to extract JSON from text:', e2);
      return null;
    }
  }
}

/**
 * Normalizes JSON data to ensure it's an array of person objects
 * @param {any} data - The JSON data to normalize
 * @returns {array} - An array of person objects
 */
export function normalizePersonsData(data) {
  if (!data) return [];
  
  // If it's already an array, use it as is
  if (Array.isArray(data)) {
    return data;
  }
  
  // Check if the data is a wrapper object with a persons array
  if (data.persons && Array.isArray(data.persons)) {
    return data.persons;
  } else if (data.people && Array.isArray(data.people)) {
    return data.people;
  } else if (data.data && Array.isArray(data.data)) {
    return data.data;
  }
  
  // If none of the above, treat as a single person and wrap in an array
  return [data];
}
