"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/context";
import { getFamilyMembers, addFamilyMember, deleteFamilyMember, getSchemes } from "@/lib/actions";
import { matchAllSchemes, calcTotalBenefit } from "@/lib/matching";
import type { FamilyMember, Scheme } from "@/lib/types";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Plus, Trash2, Gift, User } from "lucide-react";

const RELATIONS = ["Father", "Mother", "Spouse", "Son", "Daughter", "Brother", "Sister", "Grandparent", "Other"];

function familyMemberToProfile(member: FamilyMember) {
  return {
    id: member.id,
    full_name: member.name,
    email: "",
    annual_income: member.annual_income,
    state: undefined as string | undefined,
    occupation: member.occupation,
    education: member.education,
    caste_category: undefined as string | undefined,
  };
}

export default function FamilyPage() {
  const { userId, profile } = useApp();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", relation: "", age: "", occupation: "", annual_income: "", education: "" });
  const [adding, setAdding] = useState(false);

  async function load() {
    if (!userId) { setLoading(false); return; }
    const [m, s] = await Promise.all([getFamilyMembers(userId), getSchemes()]);
    setMembers(m);
    setSchemes(s);
    setLoading(false);
  }

  useEffect(() => { load(); }, [userId]);

  async function handleAdd() {
    if (!userId || !form.name || !form.relation) return;
    setAdding(true);
    await addFamilyMember({
      user_id: userId,
      name: form.name,
      relation: form.relation,
      age: form.age ? parseInt(form.age) : undefined,
      occupation: form.occupation || undefined,
      annual_income: form.annual_income ? parseInt(form.annual_income) : undefined,
      education: form.education || undefined,
    });
    setForm({ name: "", relation: "", age: "", occupation: "", annual_income: "", education: "" });
    setShowAdd(false);
    setAdding(false);
    load();
  }

  async function handleDelete(id: string) {
    await deleteFamilyMember(id);
    load();
  }

  if (!userId) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <EmptyState icon={Users} title="Create your profile first" description="We need your profile to show family benefit opportunities." actionLabel="Get Started" actionHref="/onboarding" />
    </div>
  );

  if (loading) return <LoadingState message="Loading your household…" />;

  // Self profile as first "member"
  const selfOpportunities = profile ? matchAllSchemes(profile, schemes).filter(m => m.isEligible).length : 0;
  const selfBenefit = profile ? calcTotalBenefit(matchAllSchemes(profile, schemes)) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-0.5">Family Benefits</h1>
          <p className="text-sm text-muted-foreground">Your Household</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Member
        </button>
      </div>

      <div className="space-y-3">
        {/* Self */}
        {profile && (
          <div className="flex items-center gap-4 p-5 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{profile.full_name} <span className="text-xs font-normal text-muted-foreground">(You)</span></div>
              <div className="text-sm text-muted-foreground mt-0.5">{selfOpportunities} opportunit{selfOpportunities !== 1 ? "ies" : "y"}</div>
              <div className="text-sm font-medium text-primary">₹{selfBenefit.toLocaleString("en-IN")} potential</div>
            </div>
            <Gift className="h-5 w-5 text-primary shrink-0" />
          </div>
        )}

        {/* Family Members */}
        {members.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No family members added yet.</p>
            <p>Add your parents, spouse, or children to see their opportunities.</p>
          </div>
        )}
        {members.map(member => {
          const memberProfile = familyMemberToProfile(member);
          // Use user's state/category if member doesn't have it
          if (profile?.state) memberProfile.state = profile.state;
          if (profile?.caste_category) memberProfile.caste_category = profile.caste_category;
          const memberMatches = matchAllSchemes(memberProfile, schemes);
          const eligible = memberMatches.filter(m => m.isEligible);
          const benefit = calcTotalBenefit(memberMatches);
          return (
            <div key={member.id} className="flex items-center gap-4 p-5 bg-background border rounded-xl">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{member.name} <span className="text-xs font-normal text-muted-foreground">({member.relation})</span></div>
                <div className="text-sm text-muted-foreground mt-0.5">{eligible.length} opportunit{eligible.length !== 1 ? "ies" : "y"}</div>
                {benefit > 0 && <div className="text-sm font-medium text-green-700">₹{benefit.toLocaleString("en-IN")} potential</div>}
              </div>
              <button onClick={() => handleDelete(member.id)} className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Total Household */}
      {members.length > 0 && (
        <div className="mt-6 p-5 bg-gradient-to-br from-primary/10 to-primary/5 border rounded-xl">
          <div className="text-sm text-muted-foreground mb-1">Total household potential</div>
          <div className="text-3xl font-bold text-primary">
            ₹{(selfBenefit + members.reduce((sum, m) => {
              const mp = familyMemberToProfile(m);
              if (profile?.state) mp.state = profile.state;
              if (profile?.caste_category) mp.caste_category = profile.caste_category;
              return sum + calcTotalBenefit(matchAllSchemes(mp, schemes));
            }, 0)).toLocaleString("en-IN")}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">Add Family Member</h2>
            <div className="space-y-3">
              {[
                { label: "Name *", key: "name", type: "text", placeholder: "Full name" },
                { label: "Age", key: "age", type: "number", placeholder: "Age" },
                { label: "Annual Income (₹)", key: "annual_income", type: "number", placeholder: "e.g. 150000" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className="w-full h-10 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1">Relation *</label>
                <select value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))}
                  className="w-full h-10 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                  <option value="">Select relation</option>
                  {RELATIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Occupation</label>
                <input type="text" value={form.occupation} onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))}
                  placeholder="e.g. Farmer" className="w-full h-10 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Education</label>
                <input type="text" value={form.education} onChange={e => setForm(p => ({ ...p, education: e.target.value }))}
                  placeholder="e.g. High School" className="w-full h-10 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 h-11 rounded-full border font-medium hover:bg-muted transition-colors text-sm">Cancel</button>
              <button onClick={handleAdd} disabled={!form.name || !form.relation || adding}
                className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm">
                {adding ? "Adding…" : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
