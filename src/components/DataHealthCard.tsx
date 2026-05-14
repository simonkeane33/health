'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle, CheckCircle2, XCircle, Info,
  ChevronDown, ChevronRight, ExternalLink,
} from 'lucide-react';
import type { VaultData } from '@/lib/types';
import type { FoodEntry } from '@/lib/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTargets } from '@/lib/targets-context';

interface Issue {
  severity: 'error' | 'warning' | 'info';
  label: string;
  detail: string;
  entries: FoodEntry[];
}

function computeIssues(data: VaultData): Issue[] {
  const issues: Issue[] = [];
  const { foodEntries, dailySummaries } = data;

  const missingDateEntries = foodEntries.filter((e) => !e.logged_at && !e.entry_date);
  if (missingDateEntries.length > 0) {
    issues.push({ severity: 'error', label: 'Missing date', detail: 'food entries with no date field', entries: missingDateEntries });
  }

  const missingCalsEntries = foodEntries.filter(
    (e) => e.items.length > 0 && (e.estimated_calories == null || e.estimated_calories === 0),
  );
  if (missingCalsEntries.length > 0) {
    issues.push({ severity: 'warning', label: 'Missing calories', detail: 'food entries with items but no calorie value', entries: missingCalsEntries });
  }

  const needsReviewEntries = foodEntries.filter((e) => e.needs_review === true);
  if (needsReviewEntries.length > 0) {
    issues.push({ severity: 'warning', label: 'Needs review', detail: 'food entries flagged for manual review', entries: needsReviewEntries });
  }

  // Duplicate detection
  const byDate = new Map<string, FoodEntry[]>();
  for (const e of foodEntries) {
    const day = e.entry_date ?? '';
    if (!byDate.has(day)) byDate.set(day, []);
    byDate.get(day)!.push(e);
  }
  const duplicateIds = new Set<string>();
  for (const dayEntries of byDate.values()) {
    const sorted = [...dayEntries].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        const sameCalWithin2min =
          a.estimated_calories != null &&
          a.estimated_calories === b.estimated_calories &&
          Math.abs(new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()) < 2 * 60 * 1000;
        const firstItemA = a.items[0]?.trim().toLowerCase();
        const firstItemB = b.items[0]?.trim().toLowerCase();
        const sameFirstItem = !!firstItemA && firstItemA === firstItemB;
        if (sameCalWithin2min || sameFirstItem) {
          duplicateIds.add(a.id);
          duplicateIds.add(b.id);
        }
      }
    }
  }
  const duplicateEntries = foodEntries.filter((e) => duplicateIds.has(e.id));
  if (duplicateEntries.length > 0) {
    issues.push({ severity: 'warning', label: 'Possible duplicates', detail: 'entries sharing the same first item or identical calories within 2 min', entries: duplicateEntries });
  }

  const missingMealTypeEntries = foodEntries.filter((e) => !e.meal_type || e.meal_type.trim() === '');
  if (missingMealTypeEntries.length > 0) {
    issues.push({ severity: 'info', label: 'Missing meal type', detail: 'food entries with no meal type set', entries: missingMealTypeEntries });
  }

  const lowConfidenceEntries = foodEntries.filter(
    (e) => typeof e.confidence === 'number' && e.confidence > 0 && e.confidence < 0.7,
  );
  if (lowConfidenceEntries.length > 0) {
    issues.push({ severity: 'warning', label: 'Low confidence', detail: 'food entries with confidence below 0.7', entries: lowConfidenceEntries });
  }

  const badSummaryEntries = dailySummaries
    .filter((s) => (s.food_entries ?? 0) > 0 && (s.total_calories ?? 0) === 0)
    .map((s) => ({ ...s, entry_type: 'food_entry' as const, items: [], estimated_calories: 0, meal_type: '', source: '', confidence: 0, needs_review: false, review_status: '', user_confirmed: false, logged_at: s.entry_date }));
  if (badSummaryEntries.length > 0) {
    issues.push({ severity: 'error', label: 'Zero-calorie days', detail: 'days with food entries but showing 0 kcal total', entries: badSummaryEntries as FoodEntry[] });
  }

  return issues.sort((a, b) =>
    ({ error: 0, warning: 1, info: 2 }[a.severity] - { error: 0, warning: 1, info: 2 }[b.severity]),
  );
}

function EntryLine({ entry, vaultName }: { entry: FoodEntry; vaultName: string }) {
  const label = [
    entry.entry_date,
    entry.meal_type && `· ${entry.meal_type}`,
    entry.estimated_calories > 0 && `· ${entry.estimated_calories} kcal`,
  ].filter(Boolean).join(' ');

  const itemsPreview = entry.items.slice(0, 2).join(', ') + (entry.items.length > 2 ? ` +${entry.items.length - 2}` : '');

  const obsidianHref = vaultName && entry.source_file
    ? `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(entry.source_file)}`
    : null;

  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium tabular-nums">{label}</p>
        {itemsPreview && <p className="text-[11px] text-muted-foreground truncate">{itemsPreview}</p>}
        {entry.source_file && <p className="text-[10px] text-muted-foreground/60 truncate">{entry.source_file}</p>}
      </div>
      {obsidianHref && (
        <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-[10px] shrink-0 gap-1 text-muted-foreground hover:text-foreground">
          <a href={obsidianHref} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3 w-3" />
            Open
          </a>
        </Button>
      )}
    </div>
  );
}

function IssueRow({ issue, vaultName }: { issue: Issue; vaultName: string }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = issue.severity === 'error' ? XCircle : issue.severity === 'warning' ? AlertTriangle : Info;
  const colorClass =
    issue.severity === 'error' ? 'text-destructive' : issue.severity === 'warning' ? 'text-amber-500' : 'text-muted-foreground';

  // Only show up to 20 entries in the expanded view to avoid giant lists
  const shown = issue.entries.slice(0, 20);
  const overflow = issue.entries.length - shown.length;

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start justify-between gap-3 py-3 text-left hover:bg-muted/30 transition-colors rounded-sm px-1 -mx-1"
      >
        <div className="flex items-start gap-2 min-w-0">
          <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colorClass}`} />
          <div className="min-w-0">
            <span className="text-sm font-medium">{issue.label}</span>
            <p className="text-[11px] text-muted-foreground">{issue.detail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant={issue.severity === 'error' ? 'destructive' : issue.severity === 'warning' ? 'outline' : 'secondary'}
            className={`text-[10px] px-1.5 h-5 ${issue.severity === 'warning' ? 'border-amber-500/40 text-amber-500' : ''}`}
          >
            {issue.entries.length}
          </Badge>
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="pl-5 pr-1 pb-3">
          {shown.map((e) => <EntryLine key={e.id} entry={e} vaultName={vaultName} />)}
          {overflow > 0 && (
            <p className="text-[11px] text-muted-foreground pt-2">…and {overflow} more</p>
          )}
          {!vaultName && issue.entries.some((e) => e.source_file) && (
            <p className="text-[11px] text-muted-foreground/60 pt-2">
              Set vault name in ⚙ Settings to enable "Open in Obsidian" links.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DataHealthCard({ data, defaultOpen = false }: { data: VaultData; defaultOpen?: boolean }) {
  const { vaultName } = useTargets();
  const issues = useMemo(() => computeIssues(data), [data]);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;
  const statusLabel = errorCount > 0 ? 'Issues found' : warnCount > 0 ? 'Warnings' : 'Clean';
  const [open, setOpen] = useState(errorCount > 0 || defaultOpen);

  return (
    <Card>
      <CardHeader
        className="pb-2 flex flex-row items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Data quality</div>
          {!open && issues.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              · {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Badge
          variant={errorCount > 0 ? 'destructive' : warnCount > 0 ? 'outline' : 'secondary'}
          className={warnCount > 0 && errorCount === 0 ? 'border-amber-500/40 text-amber-500' : ''}
        >
          {statusLabel}
        </Badge>
      </CardHeader>

      {open && (
        <CardContent>
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">
                No issues detected across {data.foodEntries.length} food entries and {data.weightEntries.length} weight entries.
              </span>
            </div>
          ) : (
            <div>
              {issues.map((issue) => (
                <IssueRow key={issue.label} issue={issue} vaultName={vaultName} />
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">
            {data.foodEntries.length} food · {data.weightEntries.length} weight · {data.dailySummaries.length} days
          </p>
        </CardContent>
      )}
    </Card>
  );
}
