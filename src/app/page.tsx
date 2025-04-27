import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { getCurrent } from "@/features/auth/actions";
import LogoutButton from "@/features/auth/components/logout-button";
import CompanyRedirect from "@/features/companies/components/company-redirect";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { AuthError } from "@supabase/supabase-js";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
  title: "GoDigital - Dashboard Administrateur",
  description: "",
};

export default async function DashboardAdminPage() {
  const user = await getCurrent();
  if (user instanceof AuthError) return redirect("/sign-in");
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen w-screen">
      <CompanyRedirect userId={user.id} />
      <p>Hello {user.name}</p>
      <p>{user.email}</p>
      <Avatar>
        <AvatarImage src={user.avatarUrl} alt={user.name} />
        <AvatarFallback>
          {user.name[0]}
          {user.name[1]}
        </AvatarFallback>
      </Avatar>
      <LogoutButton />
    </main>
  );
}
