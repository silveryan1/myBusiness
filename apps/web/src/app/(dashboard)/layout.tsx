import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Récupérer le profil complet avec organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organisation:organisations(*)")
    .eq("id", user.id)
    .single();

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
