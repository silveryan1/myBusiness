import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
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
    <div className="min-h-screen flex" style={{ background: "var(--bg-app)" }}>
      <div className="mesh-bg" />
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col ml-0 lg:ml-[260px] min-h-screen">
        <Header profile={profile} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
