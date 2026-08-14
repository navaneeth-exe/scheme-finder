"use server";

import { supabase } from "@/lib/supabase";
import { parseProfileText } from "@/lib/parser";
import { demoUser, demoFamily, mockSchemes } from "@/lib/seed";
import type { UserProfile, FamilyMember, Scheme, Application, Document } from "@/lib/types";

// ─── Profile Actions ────────────────────────────────────────────

export async function saveProfile(data: Partial<UserProfile> & { id: string }) {
  const { error } = await supabase
    .from("users")
    .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw new Error("We couldn't save your profile. Please try again.");
}

export async function saveVoiceProfile(userId: string, rawText: string) {
  const parsed = parseProfileText(rawText);
  const { error } = await supabase
    .from("users")
    .upsert({
      id: userId,
      voice_raw_text: rawText,
      ...parsed,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
  if (error) throw new Error("We couldn't save your voice profile. Please try again.");
  return parsed;
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

// ─── Demo Actions ────────────────────────────────────────────────

export async function setupDemoMode() {
  // Seed user
  await supabase.from("users").upsert({ ...demoUser }, { onConflict: "id" });
  // Seed family (delete existing first to avoid duplicates)
  await supabase.from("family_members").delete().eq("user_id", demoUser.id);
  await supabase.from("family_members").insert(demoFamily);
  // Seed schemes (upsert by title)
  for (const scheme of mockSchemes) {
    await supabase.from("schemes").upsert(scheme as object, { onConflict: "title" });
  }
  // Add a sample rejected application
  const { data: schemes } = await supabase.from("schemes").select("id").limit(1);
  if (schemes && schemes.length > 0) {
    await supabase.from("applications").upsert({
      user_id: demoUser.id,
      scheme_id: schemes[0].id,
      status: "Rejected",
      rejection_reason: "Uploaded photo exceeds maximum permitted file size of 50KB. Please resize and compress the image to 200x230 pixels.",
    } as object, { onConflict: "id" });
  }
  return { success: true, userId: demoUser.id };
}

// ─── Schemes Actions ─────────────────────────────────────────────

export async function getSchemes(): Promise<Scheme[]> {
  const { data, error } = await supabase
    .from("schemes")
    .select("*")
    .eq("status", "Active")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getSchemeById(id: string): Promise<Scheme | null> {
  const { data, error } = await supabase.from("schemes").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

// ─── Family Actions ──────────────────────────────────────────────

export async function getFamilyMembers(userId: string): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", userId);
  if (error) return [];
  return data ?? [];
}

export async function addFamilyMember(member: Omit<FamilyMember, "id" | "created_at">) {
  const { error } = await supabase.from("family_members").insert(member as object);
  if (error) throw new Error("We couldn't add the family member. Please try again.");
}

export async function deleteFamilyMember(id: string) {
  const { error } = await supabase.from("family_members").delete().eq("id", id);
  if (error) throw new Error("We couldn't remove the family member. Please try again.");
}

// ─── Application Actions ─────────────────────────────────────────

export async function getApplications(userId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*, scheme:schemes(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Application[];
}

export async function createApplication(userId: string, schemeId: string) {
  const { error } = await supabase.from("applications").insert({
    user_id: userId,
    scheme_id: schemeId,
    status: "Draft",
  } as object);
  if (error) throw new Error("We couldn't create your application. Please try again.");
}

// ─── Document Actions ─────────────────────────────────────────────

export async function getDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function addDocument(doc: Omit<Document, "id" | "created_at">) {
  const { error } = await supabase.from("documents").insert(doc as object);
  if (error) throw new Error("We couldn't save the document record. Please try again.");
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error("Couldn't delete the document. Please try again.");
}

// ─── Deadline Actions ─────────────────────────────────────────────

export async function saveDeadline(userId: string, schemeId: string, deadline: string) {
  const { error } = await supabase.from("saved_deadlines").upsert({
    user_id: userId,
    scheme_id: schemeId,
    deadline,
  } as object, { onConflict: "id" });
  if (error) throw new Error("We couldn't save the deadline. Please try again.");
}
