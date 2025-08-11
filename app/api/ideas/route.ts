import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

const CATEGORIES = new Set(["working", "closed", "future"])

export async function GET() {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("ideas")
    .select("id,title,description,category,created_at,message_count")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: Request) {
  const supabase = getServerSupabase()
  const body = await req.json().catch(() => ({}))
  const title = String(body.title ?? "").trim()
  const description = typeof body.description === "string" ? body.description.trim() : null
  const category = String(body.category ?? "working")

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 })
  if (!CATEGORIES.has(category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 })

  const { data, error } = await supabase
    .from("ideas")
    .insert({ title, description, category })
    .select("id,title,description,category,created_at,message_count")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
