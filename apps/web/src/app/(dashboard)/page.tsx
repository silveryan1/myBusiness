import { redirect } from "next/navigation";

// Redirige /dashboard vers /dashboard (route réelle)
// Cette page redirige vers le dashboard complet
export default function DashboardRedirect() {
  redirect("/dashboard");
}
