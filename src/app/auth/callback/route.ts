import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BASE_PATH } from "@/lib/basePath";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? BASE_PATH;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${BASE_PATH}/login`);
}
