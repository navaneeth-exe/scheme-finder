/**
 * parser.ts
 * Deterministic voice/text parser to extract profile data from natural language.
 */

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

const EDUCATION_KEYWORDS: Record<string, string> = {
  "10th": "Secondary",
  "high school": "Secondary",
  "secondary": "Secondary",
  "12th": "Higher Secondary",
  "higher secondary": "Higher Secondary",
  "plus two": "Higher Secondary",
  "puc": "Higher Secondary",
  "diploma": "Diploma",
  "iti": "ITI",
  "undergraduate": "Undergraduate",
  "ug": "Undergraduate",
  "b.tech": "Undergraduate",
  "btech": "Undergraduate",
  "bsc": "Undergraduate",
  "ba ": "Undergraduate",
  "bcom": "Undergraduate",
  "engineering student": "Undergraduate",
  "college": "Undergraduate",
  "graduate": "Graduate",
  "degree": "Undergraduate",
  "postgraduate": "Postgraduate",
  "pg": "Postgraduate",
  "masters": "Postgraduate",
  "mtech": "Postgraduate",
  "msc": "Postgraduate",
  "mba": "Postgraduate",
  "phd": "PhD",
  "doctorate": "PhD",
};

const OCCUPATION_KEYWORDS: Record<string, string> = {
  "student": "Student",
  "farmer": "Farmer",
  "agriculture": "Farmer",
  "self.?employed": "Self-Employed",
  "business": "Self-Employed",
  "entrepreneur": "Self-Employed",
  "salaried": "Salaried",
  "government employee": "Government Employee",
  "govt employee": "Government Employee",
  "teacher": "Teacher",
  "doctor": "Doctor",
  "engineer": "Engineer",
  "unemployed": "Unemployed",
  "homemaker": "Homemaker",
  "housewife": "Homemaker",
  "labourer": "Labourer",
  "labor": "Labourer",
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  "\\bsc\\b": "SC",
  "scheduled caste": "SC",
  "\\bst\\b": "ST",
  "scheduled tribe": "ST",
  "\\bobc\\b": "OBC",
  "other backward": "OBC",
  "\\bews\\b": "EWS",
  "economically weaker": "EWS",
  "general": "General",
  "open category": "General",
};

export interface ParsedProfile {
  annual_income?: number;
  state?: string;
  education?: string;
  occupation?: string;
  caste_category?: string;
  age?: number;
}

export function parseProfileText(text: string): ParsedProfile {
  const lower = text.toLowerCase();
  const result: ParsedProfile = {};

  // Age extraction
  const ageMatch = lower.match(/(\d+)\s*(?:year[s]?\s*old|yr[s]?\s*old)/);
  if (ageMatch) result.age = parseInt(ageMatch[1]);

  // Income extraction
  // Handles: 2.5 lakh, 2,50,000, 250000, 50k, 50 thousand
  const incomePatterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:cr|crore)/, multiplier: 10000000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/, multiplier: 100000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:k\b|thousand)/, multiplier: 1000 },
    { regex: /(?:rs|₹|inr)\.?\s*([\d,]+)/, multiplier: 1, isRaw: true },
    { regex: /income[^₹\d]*(\d[\d,]+)/, multiplier: 1, isRaw: true },
  ];

  for (const { regex, multiplier, isRaw } of incomePatterns) {
    const m = lower.match(regex);
    if (m) {
      const raw = isRaw ? m[1].replace(/,/g, "") : m[1];
      result.annual_income = Math.round(parseFloat(raw) * multiplier);
      break;
    }
  }

  // State extraction
  for (const state of INDIAN_STATES) {
    if (lower.includes(state.toLowerCase())) {
      result.state = state;
      break;
    }
  }

  // Education extraction
  for (const [keyword, level] of Object.entries(EDUCATION_KEYWORDS)) {
    if (new RegExp(keyword, "i").test(text)) {
      result.education = level;
      break;
    }
  }

  // Occupation extraction
  for (const [keyword, occupation] of Object.entries(OCCUPATION_KEYWORDS)) {
    if (new RegExp(keyword, "i").test(text)) {
      result.occupation = occupation;
      break;
    }
  }

  // Category extraction
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (new RegExp(keyword, "i").test(text)) {
      result.caste_category = category;
      break;
    }
  }

  return result;
}
