// Types for the entire application

export type CasteCategory = "General" | "OBC" | "SC" | "ST" | "EWS";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  voice_raw_text?: string;
  annual_income?: number;
  caste_category?: CasteCategory | string;
  state?: string;
  district?: string;
  occupation?: string;
  education?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relation: string;
  age?: number;
  occupation?: string;
  annual_income?: number;
  education?: string;
  created_at?: string;
}

export interface EligibilityJSON {
  max_income?: number;
  min_income?: number;
  category?: string[];
  states?: string[];
  education?: string[];
  occupation?: string[];
  gender?: string[];
  min_age?: number;
  max_age?: number;
}

export interface Scheme {
  id: string;
  title: string;
  description?: string;
  min_benefit_amount?: number;
  max_benefit_amount?: number;
  eligibility_json?: EligibilityJSON;
  required_documents?: string[];
  prerequisites?: string[];
  application_url?: string;
  deadline?: string;
  category?: string;
  state?: string;
  ministry?: string;
  status?: string;
  created_at?: string;
}

export type ApplicationStatus = "Draft" | "Ready" | "Submitted" | "Pending" | "Approved" | "Rejected";

export interface Application {
  id: string;
  user_id: string;
  scheme_id: string;
  status: ApplicationStatus;
  rejection_reason?: string;
  submitted_at?: string;
  updated_at?: string;
  scheme?: Scheme;
}

export interface Document {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  status: string;
  expiry_date?: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  read: boolean;
  created_at?: string;
}

export interface SavedDeadline {
  id: string;
  user_id: string;
  scheme_id: string;
  deadline: string;
  created_at?: string;
  scheme?: Scheme;
}

export interface MatchResult {
  scheme: Scheme;
  score: number;
  matchFactors: MatchFactor[];
  missingRequirements: string[];
  isEligible: boolean;
  potentialBenefit: number;
  deadlineUrgency: "urgent" | "soon" | "normal" | "none";
}

export interface MatchFactor {
  label: string;
  passed: boolean;
  weight: number;
  detail?: string;
}
