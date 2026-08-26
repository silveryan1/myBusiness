import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { organisationNom, organisationSlug, userId } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const slug = (organisationSlug || organisationNom)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: org, error: orgError } = await supabase
      .from("organisations")
      .insert({ nom: organisationNom, slug, status: "trial" })
      .select("id")
      .single();

    const finalSlug = orgError
      ? slug + "-" + Math.random().toString(36).slice(-4)
      : null;

    const orgId = orgError
      ? (await supabase.from("organisations")
          .insert({ nom: organisationNom, slug: finalSlug, status: "trial" })
          .select("id").single()).data?.id
      : org?.id;

    if (!orgId) {
      return NextResponse.json({ error: "Impossible de créer l'organisation" }, { status: 500 });
    }

    await supabase
      .from("profiles")
      .update({ organisation_id: orgId, role: "admin" })
      .eq("id", userId);

    return NextResponse.json({ success: true, organisationId: orgId });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}