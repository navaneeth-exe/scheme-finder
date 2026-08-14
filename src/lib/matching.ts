import type { EligibilityJSON, MatchFactor, MatchResult, Scheme, UserProfile } from "./types";

/**
 * Checks if a state matches. "All" means all states match.
 */
function matchesState(states: string[] | undefined, userState: string | undefined): boolean {
  if (!states || states.length === 0 || states.includes("All")) return true;
  if (!userState) return false;
  return states.some(s => s.toLowerCase() === userState.toLowerCase());
}

/**
 * Checks if education level matches.
 */
function matchesEducation(required: string[] | undefined, userEd: string | undefined): boolean {
  if (!required || required.length === 0) return true;
  if (!userEd) return false;
  return required.some(e => e.toLowerCase() === userEd.toLowerCase());
}

/**
 * Checks if caste category matches.
 */
function matchesCategory(required: string[] | undefined, userCat: string | undefined): boolean {
  if (!required || required.length === 0) return true;
  if (!userCat) return false;
  return required.some(c => c.toLowerCase() === userCat.toLowerCase());
}

/**
 * Checks if occupation matches.
 */
function matchesOccupation(required: string[] | undefined, userOcc: string | undefined): boolean {
  if (!required || required.length === 0) return true;
  if (!userOcc) return false;
  return required.some(o => o.toLowerCase() === userOcc.toLowerCase());
}

/**
 * Checks if income is within range.
 */
function matchesIncome(maxIncome: number | undefined, minIncome: number | undefined, userIncome: number | undefined): boolean {
  if (maxIncome === undefined && minIncome === undefined) return true;
  if (userIncome === undefined) return false;
  if (maxIncome !== undefined && userIncome > maxIncome) return false;
  if (minIncome !== undefined && userIncome < minIncome) return false;
  return true;
}

/**
 * Calculates deadline urgency score.
 * Returns a score between 0 and 1. Higher = more urgent.
 */
function getDeadlineScore(deadline: string | undefined): { score: number; urgency: MatchResult["deadlineUrgency"] } {
  if (!deadline) return { score: 0, urgency: "none" };
  const daysLeft = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return { score: 0, urgency: "none" };
  if (daysLeft <= 15) return { score: 1, urgency: "urgent" };
  if (daysLeft <= 30) return { score: 0.7, urgency: "soon" };
  return { score: 0.3, urgency: "normal" };
}

/**
 * Main matching engine.
 * Computes a transparent score for a user against a scheme.
 *
 * Weights:
 *   Income Match       30%
 *   State Match        20%
 *   Education Match    20%
 *   Category Match     15%
 *   Occupation Match   10%
 *   Deadline Urgency    5%
 */
export function matchScheme(user: UserProfile, scheme: Scheme): MatchResult {
  const eli: EligibilityJSON = scheme.eligibility_json ?? {};
  const factors: MatchFactor[] = [];
  const missing: string[] = [];

  // Income
  const incomePass = matchesIncome(eli.max_income, eli.min_income, user.annual_income);
  factors.push({
    label: "Income",
    passed: incomePass,
    weight: 0.30,
    detail: eli.max_income
      ? `Requires income ≤ ₹${eli.max_income.toLocaleString("en-IN")}`
      : undefined,
  });
  if (!incomePass) missing.push("Income within required range");

  // State
  const statePass = matchesState(eli.states, user.state);
  factors.push({
    label: "State",
    passed: statePass,
    weight: 0.20,
    detail: eli.states && !eli.states.includes("All") ? `Available in: ${eli.states.join(", ")}` : "Available in all states",
  });
  if (!statePass) missing.push("Residency in eligible state");

  // Education
  const educationPass = matchesEducation(eli.education, user.education);
  factors.push({
    label: "Education",
    passed: educationPass,
    weight: 0.20,
    detail: eli.education ? `Requires: ${eli.education.join(" or ")}` : undefined,
  });
  if (!educationPass) missing.push("Required education level");

  // Category
  const categoryPass = matchesCategory(eli.category, user.caste_category);
  factors.push({
    label: "Category",
    passed: categoryPass,
    weight: 0.15,
    detail: eli.category ? `Open to: ${eli.category.join(", ")}` : "Open to all categories",
  });
  if (!categoryPass) missing.push("Eligible caste/category");

  // Occupation
  const occupationPass = matchesOccupation(eli.occupation, user.occupation);
  factors.push({
    label: "Occupation",
    passed: occupationPass,
    weight: 0.10,
    detail: eli.occupation ? `Requires occupation: ${eli.occupation.join(" or ")}` : undefined,
  });
  if (!occupationPass) missing.push("Required occupation");

  // Deadline urgency
  const { score: deadlineScore, urgency } = getDeadlineScore(scheme.deadline);
  factors.push({
    label: "Deadline Urgency",
    passed: true,
    weight: 0.05,
    detail: scheme.deadline ? `Deadline: ${new Date(scheme.deadline).toLocaleDateString("en-IN")}` : "No deadline",
  });

  // Calculate total score
  const weightedScore =
    (incomePass ? 0.30 : 0) +
    (statePass ? 0.20 : 0) +
    (educationPass ? 0.20 : 0) +
    (categoryPass ? 0.15 : 0) +
    (occupationPass ? 0.10 : 0) +
    deadlineScore * 0.05;

  const score = Math.round(weightedScore * 100);
  const isEligible = incomePass && statePass; // Core gates

  return {
    scheme,
    score,
    matchFactors: factors,
    missingRequirements: missing,
    isEligible,
    potentialBenefit: scheme.max_benefit_amount ?? scheme.min_benefit_amount ?? 0,
    deadlineUrgency: urgency,
  };
}

/**
 * Match all schemes for a user, sorted by score.
 */
export function matchAllSchemes(user: UserProfile, schemes: Scheme[]): MatchResult[] {
  return schemes
    .map(s => matchScheme(user, s))
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate total potential household benefit.
 */
export function calcTotalBenefit(results: MatchResult[]): number {
  return results
    .filter(r => r.isEligible)
    .reduce((sum, r) => sum + r.potentialBenefit, 0);
}
