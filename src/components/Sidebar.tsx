'use client';

import { useRef } from 'react';
import { FolderOpen } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SidebarProps {
  onPick: (files: FileList | null) => void;
  onDemo?: () => void;
  onClear: () => void;
  loadStatus: string;
  entryCount?: number;
  dayCount?: number;
  range: string;
  onRangeChange: (range: string) => void;
}

function Logo() {
  return (
    <svg
      width="26"
      height="26"
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
  );
}

function Dot({ color }: { color: string }) {
  const colorMap: Record<string, string> = {
    teal: 'bg-primary',
    green: 'bg-emerald-500',
    gold: 'bg-amber-500',
    pink: 'bg-rose-400',
  };
  return (
    <span
      className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', colorMap[color] ?? 'bg-muted')}
      aria-hidden="true"
    />
  );
}

export function SidebarContent({
  onPick,
  onDemo,
  onClear,
  loadStatus,
  entryCount,
  dayCount,
  range,
  onRangeChange,
}: SidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasData = typeof entryCount === 'number' && entryCount > 0;

  return (
    <>
      <div className="flex items-center gap-3">
        <div
          className="grid place-items-center w-[42px] h-[42px] rounded-[14px] text-primary bg-accent shadow-[inset_0_0_0_1px_var(--border)]"
          aria-hidden="true"
        >
          <Logo />
        </div>
        <div>
          <h1 className="m-0 text-[clamp(1.125rem,1rem_+.75vw,1.5rem)] leading-[1.05] font-heading font-medium">
            Health Vault
          </h1>
          <p className="mt-1 text-muted-foreground text-[clamp(0.875rem,0.8rem_+.35vw,1rem)]">
            Browser dashboard for your Obsidian intake notes.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-none border border-border bg-card/80 p-4 ring-1 ring-foreground/5">
        <div>
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Import
          </div>
          <h2 className="m-0 text-[clamp(1.125rem,1rem_+.75vw,1.5rem)] leading-[1.15] font-heading">
            Load your vault notes
          </h2>
        </div>
        <div className="flex flex-col gap-3 rounded-none border border-dashed border-border bg-muted/50 p-4">
          <label className="text-sm">
            <strong className="block mb-1">Pick the Health folder</strong>
            <span className="text-muted-foreground">
              Select your Obsidian Health folder or any folder containing the Markdown notes.
            </span>
          </label>
          <input
            ref={(el) => {
              if (el) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).webkitdirectory = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (el as any).directory = true;
              }
            }}
            type="file"
            multiple
            accept=".md,.markdown,text/markdown"
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full"
            >
              <FolderOpen width={16} height={16} />
              Select folder
            </Button>
            <Button type="button" onClick={onDemo} variant="secondary" className="rounded-full">
              Load demo data
            </Button>
            <Button type="button" onClick={onClear} variant="outline" className="rounded-full">
              Clear
            </Button>
          </div>
        </div>
        <div>
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Status
          </div>
          <p className="text-muted-foreground">{loadStatus}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-none border border-border bg-card/80 p-4 ring-1 ring-foreground/5">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
          Legend
        </div>
        <ul className="grid gap-2 m-0 p-0 list-none">
          {[
            { color: 'teal' as const, label: 'Intake', sub: 'Calories' },
            { color: 'green' as const, label: 'Recovery', sub: 'Protein' },
            { color: 'gold' as const, label: 'Hydration', sub: 'Fluids' },
            { color: 'pink' as const, label: 'Review', sub: 'Uncertain entries' },
          ].map(({ color, label, sub }) => (
            <li
              key={label}
              className="flex items-center justify-between gap-3 rounded-none px-4 py-3 bg-muted/60"
            >
              <span className="flex items-center gap-2">
                <Dot color={color} /> {label}
              </span>
              <span className="text-muted-foreground">{sub}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4 rounded-none border border-border bg-card/80 p-4 ring-1 ring-foreground/5">
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
          Controls
        </div>
        <div className="flex flex-wrap gap-2">
          <ThemeToggle className="size-11 rounded-full border border-border bg-transparent hover:bg-muted" size="md" />
          <Select value={range} onValueChange={onRangeChange}>
            <SelectTrigger className="rounded-none h-8 bg-secondary">
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
          <div className="flex items-center gap-3 pt-2">
            <div className="text-sm">
              <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground block">
                Entries
              </span>
              <strong className="block text-xl tabular-nums">{entryCount}</strong>
            </div>
            <div className="text-sm">
              <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground block">
                Days
              </span>
              <strong className="block text-xl tabular-nums">{dayCount}</strong>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <aside className="bg-card/80 border-r border-border h-[100dvh] sticky top-0 p-6 flex flex-col gap-6 overflow-y-auto">
      <SidebarContent {...props} />
    </aside>
  );
}
