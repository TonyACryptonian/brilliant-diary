"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Send } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { Idea } from "@/app/page"
import { getSupabaseClient } from "@/lib/supabase/client"

type Message = {
  id: string
  idea_id: string
  text: string
  author_name: string | null
  created_at: string
}

export function ThreadSheet({
  open = false,
  onOpenChange = () => {},
  idea,
  accent = "#FF3B30",
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  idea: Idea | null
  accent?: string
}) {
  const supabase = getSupabaseClient()
  const [text, setText] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [displayName, setDisplayName] = useState<string>(() => {
    if (typeof window === "undefined") return "Guest"
    return localStorage.getItem("bd:name") || "Guest"
  })
  const endRef = useRef<HTMLDivElement | null>(null)

  const progress = useMemo(() => {
    const n = idea?.message_count ?? 0
    return Math.min(100, Math.round((n / 50) * 100))
  }, [idea?.message_count])

  // Load and subscribe
  useEffect(() => {
    if (!open || !idea) return
    let isMounted = true

    async function load() {
      const res = await fetch(`/api/messages?idea_id=${idea.id}`, { cache: "no-store" })
      if (!isMounted) return
      if (!res.ok) {
        console.error("Failed to load messages")
        setMessages([])
      } else {
        const { data } = await res.json()
        setMessages((data ?? []) as Message[])
      }
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50)
    }
    load()

    const channel = supabase
      .channel(`messages:${idea.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `idea_id=eq.${idea.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as Message])
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id))
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as Message
            setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)))
          }
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50)
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [open, idea]) // Updated dependency array to include idea directly

  if (!idea) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-black/70 backdrop-blur-xl border-l border-white/10"
        />
      </Sheet>
    )
  }

  async function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    setText("")

    // optimistic
    const temp: Message = {
      id: `temp-${Date.now()}`,
      idea_id: idea.id,
      text: trimmed,
      author_name: displayName || "Guest",
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, temp])

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea_id: idea.id,
        text: trimmed,
        author_name: displayName || "Guest",
      }),
    })
    if (!res.ok) {
      // rollback optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== temp.id))
      const { error } = await res.json().catch(() => ({ error: "Failed to send message" }))
      console.error("Failed to send message:", error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-black/70 backdrop-blur-xl border-l border-white/10">
        <SheetHeader>
          <SheetTitle className="text-white">{idea.title}</SheetTitle>
          <SheetDescription className="text-white/60">
            Discussion thread. Collaborate, iterate, and ship.
          </SheetDescription>
        </SheetHeader>

        {/* Display name quick edit */}
        <div className="mt-2 text-xs text-white/50">
          Posting as:{" "}
          <button
            className="underline decoration-dotted hover:text-white"
            onClick={() => {
              const name = prompt("Set your display name", displayName || "Guest") || displayName
              setDisplayName(name)
              try {
                localStorage.setItem("bd:name", name)
              } catch {}
            }}
          >
            {displayName || "Guest"}
          </button>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/50">Progress</span>
            <span className="text-xs text-white/60">{Math.min(50, idea.message_count)}/50</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-white/10"
            style={{ transition: "all 500ms ease", ["--progress-foreground" as any]: accent }}
            aria-label="Thread progress"
          />
        </div>

        <ScrollArea className="mt-4 h-[60vh] rounded-lg border border-white/10 bg-white/5">
          <div className="p-4 space-y-3">
            {messages.map((m) => {
              const isYou = (m.author_name || "Guest") === (displayName || "Guest")
              return (
                <div
                  key={m.id}
                  className="rounded-xl px-3 py-2 text-sm text-white/90"
                  style={{
                    background: isYou ? `${accent}22` : "rgba(255,255,255,0.06)",
                    border: `1px solid ${isYou ? `${accent}33` : "rgba(255,255,255,0.08)"}`,
                    boxShadow: isYou
                      ? `0 0 0 1px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.04)`
                      : "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="text-xs text-white/60 mb-1">
                    {m.author_name || "Guest"} • {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div className="leading-relaxed whitespace-pre-wrap">{m.text}</div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
        </ScrollArea>

        <SheetFooter className="mt-4">
          <form
            className="w-full flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Write a message as ${displayName || "Guest"}...`}
              className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
            />
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-600/90 text-white"
              style={{ backgroundColor: accent }}
            >
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
