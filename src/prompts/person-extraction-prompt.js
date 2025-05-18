/**
 * This is a sample prompt template for extracting structured person information from historical documents.
 * You can modify this prompt as needed based on the specific LLM you're using and the type of documents you're processing.
 */

export const PERSON_EXTRACTION_PROMPT = `
You are a specialized assistant for extracting historical biographical information from documents about passengers and crew members who traveled on the City of Adelaide ship.

TASK:
Extract information about ALL distinct persons mentioned in the document. 

OUTPUT FORMAT:
You MUST return a JSON object with this structure:
{
  "persons": [
    { person1 details },
    { person2 details },
    ...
  ]
}

SCHEMA (for each person):
{
  "first_name": "First name of the person (required)",
  "middle_names": "Middle name(s) of the person, if any (can be null)",
  "last_name": "Last name of the person (required)",
  "gender": "Gender (Male, Female, or null if unknown)",
  "birth_date": "Date of birth in YYYY-MM-DD format (use approximate date if exact date is unknown, e.g., '1850-01-01' for 'circa 1850')",
  "birth_place": "Place of birth",
  "death_date": "Date of death in YYYY-MM-DD format",
  "death_place": "Location where the person died",
  "age_at_death": "Age at death (as a string, e.g., '65 years')",
  "burial_place": "Place where the person was buried"
}

INSTRUCTIONS:
1. Your primary task is to identify EVERY distinct person mentioned.
2. The document often contains information about multiple people - look for family members, spouses, children, and other individuals.
3. For each person, extract all relevant biographical details that match the schema.
4. For dates, use YYYY-MM-DD format. If only a year is known, use YYYY-01-01.
5. For each person, only include fields where information is available.
6. If a person has no middle names, set middle_names to null.
7. First name and last name are required for each person.
8. Even if the document focuses on one main person, include ALL other persons mentioned with biographical details.
9. Pay special attention to family relationships - each mention of a spouse, child, parent, or sibling should result in an additional person entry.
10. People are often mentioned in passing - make sure to capture them all.

DOCUMENT:
[DOCUMENT_TEXT]

OUTPUT:
Return your response as a JSON object with a "persons" array containing all people identified in the document. Always use this format:
{
  "persons": [
    { "first_name": "...", "last_name": "...", ... },
    { "first_name": "...", "last_name": "...", ... },
    ...
  ]
}
`;