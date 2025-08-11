"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Idea } from "@/app/page"
import { MessageSquareText, Trash2 } from "lucide-react"
import { useMemo } from "react"

export function IdeaCard({
  idea,
  onOpenThread,
  onDelete,
  accent = "#FF3B30",
}: {
  idea: Idea
  onOpenThread: () => void
  onDelete: () => void
  accent?: string
}) {
  const progress = useMemo(() => {
    return Math.min(100, Math.round((Math.min(50, idea.message_count) / 50) * 100))
  }, [idea.message_count])

  return (
    <div
      role="article"
      aria-label={idea.title}
      className="group rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 relative overflow-hidden"
      style={{
        boxShadow: "0 10px 25px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
        transition: "transform 220ms ease, box-shadow 220ms ease",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(400px 120px at 80% -20%, ${accent}15, transparent 70%)` }}
      />

      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium tracking-tight">{idea.title}</h3>
          {idea.description ? <p className="mt-1 text-sm text-white/60 line-clamp-2">{idea.description}</p> : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Delete idea"
          className="rounded-full hover:bg-red-600/20 text-white/70 hover:text-white"
          style={{ color: "#fff" }}
        >
          <Trash2 className="h-4 w-4" color={accent} />
        </Button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onOpenThread}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          aria-label="Open discussion thread"
        >
          <MessageSquareText className="h-4 w-4" color={accent} />
          <span>
            {idea.message_count} message{idea.message_count === 1 ? "" : "s"}
          </span>
        </button>

        <span className="text-xs text-white/50">{new Date(idea.created_at).toLocaleDateString()}</span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/50">Progress</span>
          <span className="text-xs text-white/60">{Math.min(50, idea.message_count)}/50</span>
        </div>
        <Progress
          value={progress}
          className="h-2 bg-white/10"
          style={{ transition: "all 400ms ease", ["--progress-foreground" as any]: accent }}
        />
      </div>
    </div>
  )
}
