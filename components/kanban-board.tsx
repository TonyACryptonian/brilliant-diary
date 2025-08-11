"use client"

import type React from "react"

import { useMemo, useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core"
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import type { Idea, Category } from "@/app/page"
import { IdeaCard } from "./idea-card"

type Props = {
  ideas: Idea[]
  onMove: (id: string, to: Category) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onOpenThread: (idea: Idea) => void
  accent?: string
}

const columns: { id: Category; title: string }[] = [
  { id: "working", title: "Idea Working" },
  { id: "closed", title: "Idea Closed" },
  { id: "future", title: "Idea for Future" },
]

export function KanbanBoard({ ideas, onMove, onDelete, onOpenThread, accent = "#FF3B30" }: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  )
  const [activeId, setActiveId] = useState<string | null>(null)

  // Column orders derived then synced with incoming data
  const initialOrder = useMemo(() => {
    const order: Record<Category, string[]> = { working: [], closed: [], future: [] }
    const sorted = [...ideas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    sorted.forEach((i) => order[i.category].push(i.id))
    return order
  }, []) // run once

  const [order, setOrder] = useState<Record<Category, string[]>>(initialOrder)

  useMemo(() => {
    const ids = new Set(ideas.map((i) => i.id))
    const next: Record<Category, string[]> = { working: [], closed: [], future: [] }
    ;(Object.keys(order) as Category[]).forEach((c) => {
      next[c] = order[c].filter((id) => ids.has(id))
    })
    // Add new ideas into correct column at the top
    ideas.forEach((i) => {
      if (!next[i.category].includes(i.id)) {
        next[i.category] = [i.id, ...next[i.category]]
      }
    })
    setOrder(next)
  }, [ideas]) // eslint-disable-line

  const ideasById = useMemo(() => {
    const map = new Map<string, Idea>()
    ideas.forEach((i) => map.set(i.id, i))
    return map
  }, [ideas])

  function findContainer(id: string): Category | null {
    for (const c of columns) if (order[c.id].includes(id)) return c.id
    return null
  }

  function onDragStart(e: DragStartEvent) {
    if (typeof e.active.id === "string") setActiveId(e.active.id)
  }

  function onDragOver(e: DragOverEvent) {
    const over = e.over
    if (!over || !activeId) return
    const overId = String(over.id)
    const from = findContainer(activeId)
    const overIsColumn = overId === "working" || overId === "closed" || overId === "future"
    const to = overIsColumn ? (overId as Category) : findContainer(overId)
    if (!from || !to || from === to) return

    setOrder((prev) => {
      const fromItems = prev[from].filter((i) => i !== activeId)
      const toItems = prev[to].slice()
      const overIndex = overIsColumn ? toItems.length : toItems.indexOf(overId)
      toItems.splice(overIndex < 0 ? toItems.length : overIndex, 0, activeId)
      return { ...prev, [from]: fromItems, [to]: toItems }
    })
  }

  function onDragEnd(e: DragEndEvent) {
    const overId = e.over ? String(e.over.id) : null
    const id = e.active ? String(e.active.id) : null
    setActiveId(null)
    if (!id || !overId) return

    const from = findContainer(id)
    const overIsColumn = overId === "working" || overId === "closed" || overId === "future"
    const to = overIsColumn ? (overId as Category) : findContainer(overId)
    if (!from || !to) return

    if (from === to) {
      const oldIndex = order[from].indexOf(id)
      const newIndex = overIsColumn ? order[to].length : order[to].indexOf(overId)
      const newItems = arrayMove(order[from], oldIndex, newIndex < 0 ? order[to].length : newIndex)
      setOrder({ ...order, [from]: newItems })
    } else {
      setOrder((prev) => ({ ...prev }))
      onMove(id, to)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {columns.map((col) => {
          const items = order[col.id].map((id) => ideasById.get(id)).filter(Boolean) as Idea[]
          return (
            <Column key={col.id} id={col.id} title={col.title} accent={accent} count={items.length}>
              <SortableContext items={order[col.id]} strategy={rectSortingStrategy}>
                <AnimatePresence initial={false}>
                  {items.map((idea) => (
                    <SortableCardWrapper key={idea.id} id={idea.id}>
                      <IdeaCard
                        idea={idea}
                        accent={accent}
                        onOpenThread={() => onOpenThread(idea)}
                        onDelete={() => onDelete(idea.id)}
                      />
                    </SortableCardWrapper>
                  ))}
                </AnimatePresence>
              </SortableContext>
            </Column>
          )
        })}
      </div>
    </DndContext>
  )
}

function Column({
  id,
  title,
  accent,
  count,
  children,
}: {
  id: Category
  title: string
  accent: string
  count: number
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
      style={{
        boxShadow: "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
        outline: isOver ? `2px dashed ${accent}55` : "none",
        background: isOver
          ? "linear-gradient(0deg, rgba(255,59,48,0.07), rgba(255,59,48,0.07)), rgba(255,255,255,0.03)"
          : "rgba(255,255,255,0.03)",
        transition: "background 180ms ease, outline-color 180ms ease",
      }}
    >
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-widest text-white/70">{title}</h2>
        <span
          className="px-2 py-0.5 text-xs rounded-full"
          style={{ backgroundColor: "rgba(255,59,48,0.12)", color: accent, boxShadow: `inset 0 0 0 1px ${accent}22` }}
          aria-label={`${count} ideas`}
        >
          {count}
        </span>
      </div>

      <ScrollArea className="h-[calc(70vh)]">
        <div ref={setNodeRef} className="p-3 pt-0">
          {count === 0 ? (
            <div
              className="mb-3 rounded-xl border border-dashed border-white/15 bg-white/5 py-10 text-center text-sm text-white/50"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
            >
              Drop ideas here
            </div>
          ) : null}
          <div className="space-y-3">{children}</div>
        </div>
      </ScrollArea>
    </div>
  )
}

function SortableCardWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={style as any}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.18 } }}
      className={isDragging ? "opacity-70" : undefined}
      {...attributes}
      {...listeners}
    >
      {children}
    </motion.div>
  )
}
