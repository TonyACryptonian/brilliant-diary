import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = getServerSupabase()
  const url = new URL(req.url)
  const idea_id = url.searchParams.get("idea_id")
  if (!idea_id) return NextResponse.json({ error: "idea_id is required" }, { status: 400 })

  const { data, error } = await supabase
    .from("messages")
    .select("id,idea_id,text,author_name,created_at")
    .eq("idea_id", idea_id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json().catch(() => ({}))
  const idea_id = String(body.idea_id ?? "")
  const text = String(body.text ?? "").trim()
  const author_name = (body.author_name ?? null) as string | null

  if (!idea_id) return NextResponse.json({ error: "idea_id is required" }, { status: 400 })
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 })

  const { data, error } = await supabase
    .from("messages")
    .insert({ idea_id, text, author_name })
    .select("id,idea_id,text,author_name,created_at")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
