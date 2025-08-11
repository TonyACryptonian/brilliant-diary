"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"
import type { Category } from "@/app/page"

export function CreateIdeaDialog({
  open = false,
  onOpenChange = () => {},
  onCreate,
  accent = "#FF3B30",
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreate: (data: { title: string; description?: string; category: Category }) => void | Promise<void>
  accent?: string
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<Category>("working")

  function resetAndClose() {
    setTitle("")
    setDescription("")
    setCategory("working")
    onOpenChange(false)
  }

  async function submit() {
    const t = title.trim()
    if (!t) return
    await onCreate({ title: t, description: description.trim() || undefined, category })
    resetAndClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetAndClose()
        else onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg bg-black/70 backdrop-blur-xl border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Create a new idea</DialogTitle>
          <DialogDescription className="text-white/60">Pick a category and give it a concise title.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm text-white/70">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Collaborative mind-map with AI clustering"
              className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="desc" className="text-sm text-white/70">
              Description (optional)
            </label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One or two sentences that capture the essence..."
              className="min-h-[100px] bg-white/10 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm text-white/70">Category</span>
            <RadioGroup
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
              className="grid grid-cols-3 gap-2"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setCategory("working")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setCategory("working")}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  category === "working"
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                aria-pressed={category === "working"}
              >
                <RadioGroupItem id="cat-working" value="working" />
                <span className="text-white/80 text-sm">Working</span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setCategory("closed")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setCategory("closed")}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  category === "closed"
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                aria-pressed={category === "closed"}
              >
                <RadioGroupItem id="cat-closed" value="closed" />
                <span className="text-white/80 text-sm">Closed</span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setCategory("future")}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setCategory("future")}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  category === "future"
                    ? "border-red-500/50 bg-red-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                aria-pressed={category === "future"}
              >
                <RadioGroupItem id="cat-future" value="future" />
                <span className="text-white/80 text-sm">Future</span>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" className="text-white/80 hover:bg-white/10" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            className="bg-red-600 hover:bg-red-600/90 text-white shadow-[0_0_25px_rgba(255,59,48,0.35)]"
            style={{ backgroundColor: accent }}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
