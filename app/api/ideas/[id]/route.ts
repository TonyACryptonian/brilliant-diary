import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase/server"

const CATEGORIES = new Set(["working", "closed", "future"])

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const { id } = params
  const body = await req.json().catch(() => ({}))
  const to = String(body.category ?? "")
  if (!CATEGORIES.has(to)) return NextResponse.json({ error: "Invalid category" }, { status: 400 })

  const { error } = await supabase.from("ideas").update({ category: to }).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = getServerSupabase()
  const { id } = params
  const { error } = await supabase.from("ideas").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
