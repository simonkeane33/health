'use client';

import { useRef } from 'react';
import { FolderOpen } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

interface SidebarProps {
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
    teal: 'bg-[var(--hv-teal)]',
    green: 'bg-[var(--hv-green)]',
    gold: 'bg-[var(--hv-gold)]',
    pink: 'bg-[var(--hv-pink)]',
  };
  return (
    <span
      className={cn('dot', colorMap[color] ?? 'bg-[var(--hv-text-faint)]')}
      aria-hidden="true"
    />
  );
}

export function Sidebar({
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
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <Logo />
        </div>
        <div className="brand-copy">
          <h1>Health Vault</h1>
          <p>Browser dashboard for your Obsidian intake notes.</p>
        </div>
      </div>

      <section className="panel sidebar-section">
        <div>
          <div className="micro-label">Import</div>
          <h2>Load your vault notes</h2>
        </div>
        <div className="picker">
          <label>
            <strong>Pick the Health folder</strong>
            <br />
            <span className="subtle">
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
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => inputRef.current?.click()}>
              <FolderOpen width={16} height={16} />
              Select folder
            </button>
            <button className="btn btn-primary" type="button" onClick={onDemo}>
              Load demo data
            </button>
            <button className="btn btn-secondary" type="button" onClick={onClear}>
              Clear
            </button>
          </div>
        </div>
        <div>
          <div className="micro-label">Status</div>
          <p className="subtle">{loadStatus}</p>
        </div>
      </section>

      <section className="panel sidebar-section">
        <div className="micro-label">Legend</div>
        <ul className="legend-list">
          <li>
            <span className="flex items-center gap-2">
              <Dot color="teal" /> Intake
            </span>
            <span className="subtle">Calories</span>
          </li>
          <li>
            <span className="flex items-center gap-2">
              <Dot color="green" /> Recovery
            </span>
            <span className="subtle">Protein</span>
          </li>
          <li>
            <span className="flex items-center gap-2">
              <Dot color="gold" /> Hydration
            </span>
            <span className="subtle">Fluids</span>
          </li>
          <li>
            <span className="flex items-center gap-2">
              <Dot color="pink" /> Review
            </span>
            <span className="subtle">Uncertain entries</span>
          </li>
        </ul>
      </section>

      <section className="panel sidebar-section">
        <div className="micro-label">Controls</div>
        <div className="actions">
          <ThemeToggle className="btn-ghost theme-toggle" size="md" />
          <select
            value={range}
            onChange={(e) => onRangeChange(e.target.value)}
            className="btn btn-secondary"
            aria-label="Select chart range"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
        </div>
        {hasData && (
          <div className="flex items-center gap-3 pt-2">
            <div className="text-sm">
              <span className="micro-label">Entries</span>
              <strong className="block text-xl tabular-nums">{entryCount}</strong>
            </div>
            <div className="text-sm">
              <span className="micro-label">Days</span>
              <strong className="block text-xl tabular-nums">{dayCount}</strong>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
}
