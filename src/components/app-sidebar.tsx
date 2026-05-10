"use client"

import { useRef } from "react"
import { FolderOpen } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThemeToggle } from "./ThemeToggle"
import { cn } from "@/lib/utils"

export interface AppSidebarProps {
  onPick: (files: FileList | null) => void
  onDemo?: () => void
  onClear: () => void
  loadStatus: string
  entryCount?: number
  dayCount?: number
  range: string
  onRangeChange: (range: string) => void
}

function Dot({ color }: { color: string }) {
  const colorMap: Record<string, string> = {
    teal: 'bg-primary',
    green: 'bg-emerald-500',
    gold: 'bg-amber-500',
    pink: 'bg-rose-400',
  }
  return (
    <span
      className={cn("h-2 w-2 rounded-full", colorMap[color] ?? "bg-muted")}
      aria-hidden="true"
    />
  )
}

export function AppSidebar({
  onPick,
  onDemo,
  onClear,
  loadStatus,
  entryCount,
  dayCount,
  range,
  onRangeChange,
}: AppSidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hasData = typeof entryCount === "number" && entryCount > 0

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3c2.5 0 4 1.5 4 3.5 0 1.4-.6 2.4-1.8 3.4 2.5.8 4.3 3 4.3 5.7 0 3.5-2.9 5.9-6.5 5.9S5.5 19.1 5.5 15.6c0-2.7 1.8-4.9 4.3-5.7C8.6 8.9 8 7.9 8 6.5 8 4.5 9.5 3 12 3Z" />
                    <path d="M12 8.3v7.8" />
                    <path d="M8.9 12.1H15" />
                  </svg>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Health Vault</span>
                  <span className="truncate text-xs">Obsidian Health Dashboard</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Import */}
        <SidebarGroup>
          <SidebarGroupLabel>Import</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-3 rounded-lg border border-dashed p-3">
              <label className="text-xs text-muted-foreground">
                Pick the Health folder. Select your Obsidian Health folder or any folder containing Markdown notes.
              </label>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".md,.markdown,text/markdown"
                className="hidden"
                onChange={(e) => onPick(e.target.files)}
                // @ts-expect-error — non-standard but well-supported for folder selection
                webkitdirectory=""
                directory=""
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>
                  <FolderOpen className="mr-1 size-4" />
                  Select folder
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={onDemo}>
                  Demo
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={onClear}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{loadStatus}</div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Legend */}
        <SidebarGroup>
          <SidebarGroupLabel>Legend</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { color: "teal" as const, label: "Intake", sub: "Calories" },
                { color: "green" as const, label: "Recovery", sub: "Protein" },
                { color: "gold" as const, label: "Hydration", sub: "Fluids" },
                { color: "pink" as const, label: "Review", sub: "Uncertain" },
              ].map(({ color, label, sub }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton asChild>
                    <span className="flex items-center gap-2">
                      <Dot color={color} />
                      <span className="flex-1">{label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{sub}</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Controls */}
        <SidebarGroup>
          <SidebarGroupLabel>Controls</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-wrap gap-2">
              <ThemeToggle className="size-8 rounded-lg border" size="sm" />
              <Select value={range} onValueChange={onRangeChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasData && (
              <div className="mt-3 flex items-center gap-3">
                <div className="text-sm">
                  <span className="block text-xs font-medium text-muted-foreground">Entries</span>
                  <strong className="block text-lg tabular-nums">{entryCount}</strong>
                </div>
                <div className="text-sm">
                  <span className="block text-xs font-medium text-muted-foreground">Days</span>
                  <strong className="block text-lg tabular-nums">{dayCount}</strong>
                </div>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  )
}
