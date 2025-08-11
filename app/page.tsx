"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Playfair_Display } from "next/font/google"
import { KanbanBoard } from "@/components/kanban-board"
import { CreateIdeaDialog } from "@/components/create-idea-dialog"
import { ThreadSheet } from "@/components/thread-sheet"
import { getSupabaseClient } from "@/lib/supabase/client"

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

export type Category = "working" | "closed" | "future"

export type Idea = {
  id: string
  title: string
  description: string | null
  category: Category
  created_at: string
  message_count: number
}

const ACCENT = "#FF3B30"

export default function Page() {
  const supabase = getSupabaseClient()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [openCreate, setOpenCreate] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  // Load ideas and subscribe to realtime updates
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/ideas", { cache: "no-store" })
      if (!res.ok) {
        console.error("Failed to load ideas")
        return
      }
      const { data } = await res.json()
      setIdeas(data ?? [])
    }
    load()

    const channel = supabase
      .channel("ideas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ideas" }, (payload) => {
        setIdeas((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as any
            if (prev.some((i) => i.id === row.id)) return prev
            return [row as Idea, ...prev]
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as any
            return prev.map((i) => (i.id === row.id ? (row as Idea) : i))
          }
          if (payload.eventType === "DELETE") {
            const row = payload.old as any
            return prev.filter((i) => i.id !== row.id)
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Create
  async function createIdea(data: { title: string; description?: string; category: Category }) {
    const tempId = `temp-${crypto.randomUUID?.() ?? Date.now()}`
    const tempIdea: Idea = {
      id: tempId,
      title: data.title,
      description: data.description ?? null,
      category: data.category || "working",
      created_at: new Date().toISOString(),
      message_count: 0,
    }
    setIdeas((prev) => [tempIdea, ...prev])

    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed to create" }))
      console.error("Failed to create idea:", error)
      setIdeas((prev) => prev.filter((i) => i.id !== tempId))
      if (typeof window !== "undefined") alert(`Could not create idea: ${error}`)
      return
    }
    const { data: inserted } = await res.json()
    setIdeas((prev) => [inserted as Idea, ...prev.filter((i) => i.id !== tempId)])
  }

  // Move between columns
  async function moveIdea(id: string, to: Category) {
    const current = ideas.find((i) => i.id === id)
    if (!current || current.category === to) return
    // optimistic
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, category: to } : i)))
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: to }),
    })
    if (!res.ok) {
      // revert if failed
      setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, category: current!.category } : i)))
      console.error("Failed to move idea")
    }
  }

  // Delete
  async function deleteIdea(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" })
    if (!res.ok) console.error("Failed to delete idea")
  }

  const headerIndicator = useMemo(() => ({ backgroundColor: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }), [])

  return (
    <div
      className={`relative min-h-screen ${playfair.variable}`}
      style={{
        background:
          "radial-gradient(1200px 600px at 100% -10%, rgba(255,59,48,0.10), transparent 60%), radial-gradient(800px 500px at -10% 10%, rgba(255,59,48,0.08), transparent 60%), #0B0B0F",
      }}
    >
      <header className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-black/30">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span
              className="text-2xl md:text-3xl font-semibold tracking-tight"
              style={{
                color: "white",
                fontFamily: "var(--font-playfair), ui-serif, Georgia, Cambria, Times New Roman, Times, serif",
              }}
            >
              Brilliant Diary
            </span>
            <span className="text-xs md:text-sm text-white/50">Ideas worth sharing</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full" style={headerIndicator} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <section className="mb-6 md:mb-10">
          <p className="text-sm md:text-base text-white/60 max-w-2xl">
            Shared, realtime board. Create ideas, drag them between categories, and discuss in threads.
          </p>
        </section>

        <KanbanBoard
          ideas={ideas}
          accent={ACCENT}
          onMove={moveIdea}
          onDelete={deleteIdea}
          onOpenThread={(idea) => setActiveThreadId(idea.id)}
        />
      </main>

      {/* Floating Create */}
      <div className="fixed right-6 bottom-6 z-50">
        <Button
          size="lg"
          className="h-14 rounded-full px-6 bg-red-600 hover:bg-red-600/90 text-white shadow-[0_0_0_0_rgba(255,59,48,0.7)] hover:shadow-[0_0_45px_6px_rgba(255,59,48,0.30)] transition-shadow duration-500"
          style={{ backgroundColor: ACCENT }}
          onClick={() => setOpenCreate(true)}
        >
          <Plus className="mr-2 h-5 w-5" /> Create Idea
        </Button>
      </div>

      <CreateIdeaDialog open={openCreate} onOpenChange={setOpenCreate} accent={ACCENT} onCreate={createIdea} />

      <ThreadSheet
        open={!!activeThreadId}
        onOpenChange={(open) => !open && setActiveThreadId(null)}
        idea={activeThreadId ? (ideas.find((i) => i.id === activeThreadId) ?? null) : null}
        accent={ACCENT}
      />
    </div>
  )
}
