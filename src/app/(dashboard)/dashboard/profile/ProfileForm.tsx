"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { updateProfile, updateUserRole } from "@/app/actions/profile";
import { Shield, Mail, User as UserIcon, Calendar, CheckCircle, AlertTriangle, Cpu } from "lucide-react";

interface ProfileFormProps {
  initialUser: {
    id: string;
    email: string;
    name: string;
    role: "user" | "admin" | "editor";
    isVerified: boolean;
    avatarUrl?: string;
    createdAt: string;
  };
}

export function ProfileForm({ initialUser }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialUser.name);
  const [role, setRole] = useState(initialUser.role);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [roleMessage, setRoleMessage] = useState({ text: "", type: "" });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileMessage({ text: "", type: "" });

    const res = await updateProfile(name);

    if (res.error) {
      setProfileMessage({ text: res.error, type: "error" });
    } else {
      setProfileMessage({ text: res.message || "Profile updated.", type: "success" });
      router.refresh();
    }
    setLoadingProfile(false);
  };

  const handleRoleChange = async (newRole: "user" | "admin" | "editor") => {
    setLoadingRole(true);
    setRoleMessage({ text: "", type: "" });

    const res = await updateUserRole(newRole);

    if (res.error) {
      setRoleMessage({ text: res.error, type: "error" });
    } else {
      setRole(newRole);
      setRoleMessage({ text: res.message || "Role updated.", type: "success" });
      router.refresh();
    }
    setLoadingRole(false);
  };

  const formattedDate = new Date(initialUser.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Settings Panel */}
      <div className="lg:col-span-2 space-y-6">
        <GlassCard hoverable={false} className="border-white/5 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">General Information</h3>
            <p className="text-slate-400 text-xs mt-0.5">Manage your user profile display name.</p>
          </div>

          {profileMessage.text && (
            <div
              className={`p-3 border rounded-xl flex gap-2 text-xs items-center ${
                profileMessage.type === "success"
                  ? "bg-neon-emerald/10 border-neon-emerald/20 text-neon-emerald"
                  : "bg-neon-pink/10 border-neon-pink/20 text-neon-pink"
              }`}
            >
              {profileMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={initialUser.email}
                  disabled
                  className="w-full bg-white/3 border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Contact support to change your account email.</p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Display Name</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-neon-violet placeholder-slate-500"
                  placeholder="Full Name"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingProfile}
              className="px-5 py-2.5 rounded-xl bg-neon-violet hover:bg-neon-violet/85 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              {loadingProfile ? "Saving Profile..." : "Update Profile"}
            </button>
          </form>
        </GlassCard>

        {/* RBAC Tester */}
        <GlassCard hoverable={false} className="border-white/5 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Role-Based Access Control Tester</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Change your role on-the-fly to test protected middleware routes and component states.
            </p>
          </div>

          {roleMessage.text && (
            <div
              className={`p-3 border rounded-xl flex gap-2 text-xs items-center ${
                roleMessage.type === "success"
                  ? "bg-neon-emerald/10 border-neon-emerald/20 text-neon-emerald"
                  : "bg-neon-pink/10 border-neon-pink/20 text-neon-pink"
              }`}
            >
              {roleMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{roleMessage.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {(["user", "editor", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  disabled={loadingRole}
                  className={`py-4 rounded-xl border flex flex-col items-center gap-2 justify-center transition-all ${
                    role === r
                      ? "bg-neon-violet/10 border-neon-violet text-white font-bold"
                      : "bg-white/3 border-white/5 text-slate-400 hover:border-white/10 hover:text-white"
                  }`}
                >
                  <Shield className={`w-5 h-5 ${role === r ? "text-neon-violet" : "text-slate-500"}`} />
                  <span className="text-xs uppercase tracking-wider">{r}</span>
                </button>
              ))}
            </div>

            <div className="p-4 bg-white/3 rounded-xl border border-white/5 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-white">How to verify:</p>
              <p>1. Select <span className="font-semibold text-neon-cyan">USER</span> or <span className="font-semibold text-neon-cyan">EDITOR</span> role. Try visiting the Admin page; you will be blocked.</p>
              <p>2. Select <span className="font-semibold text-neon-cyan">ADMIN</span> role. Navigate to the Admin page; access will be allowed.</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Profile Card Sidebar */}
      <div className="space-y-6">
        <GlassCard hoverable={false} className="border-white/5 p-6 text-center space-y-6">
          <div className="flex flex-col items-center">
            {initialUser.avatarUrl ? (
              <img
                src={initialUser.avatarUrl}
                alt={initialUser.name}
                className="w-20 h-20 rounded-full border border-white/20 shadow-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-neon-violet to-neon-pink border border-white/10 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg">
                {initialUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )}

            <h3 className="text-lg font-bold text-white mt-4">{initialUser.name}</h3>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-1.5">
              {role}
            </span>
          </div>

          <div className="border-t border-white/5 pt-4 text-left space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Account ID</span>
              <span className="font-mono text-slate-300">{initialUser.id.slice(-8)} (active)</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Verification</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-neon-emerald" />
                <span className="text-neon-emerald font-medium">Verified Email</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Joined Date</span>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
