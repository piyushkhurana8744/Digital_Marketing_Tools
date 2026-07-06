import React from "react";
import { getCurrentUser } from "@/lib/auth/dal";
import { ProfileForm } from "./ProfileForm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "My Profile - DigiTools AI",
  description: "Manage your account, credentials, and test role authorization credentials.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8 pb-10 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Account Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review credentials, change your name, and toggle role permissions.
        </p>
      </div>

      <ProfileForm initialUser={user} />
    </div>
  );
}
