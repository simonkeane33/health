'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { VaultData } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Issue {
  severity: 'error' | 'warning' | 'info';
  label: string;
  count: number;
  detail?: string;
}

function computeIssues(data: VaultData): Issue[] {
  const issues: Issue[] = [];
  const { foodEntries, weightEntries, dailySummaries } = data;

  const missingDate = foodEntries.filter((e) => !e.logged_at && !e.entry_date).length;
  if (missingDate > 0) {
    issues.push({ severity: 'error', label: 'Missing date', count: missingDate, detail: 'food entries with no date field' });
  }

  const missingCals = foodEntries.filter(
    (e) => e.items.length > 0 && (e.estimated_calories == null || e.estimated_calories === 0),
  ).length;
  if (missingCals > 0) {
    issues.push({ severity: 'warning', label: 'Missing calories', count: missingCals, detail: 'food entries with items but no calorie value' });
  }

  const missingMealType = foodEntries.filter((e) => !e.meal_type || e.meal_type.trim() === '').length;
  if (missingMealType > 0) {
    issues.push({ severity: 'info', label: 'Missing meal type', count: missingMealType, detail: 'food entries with no meal type set' });
  }

  const lowConfidence = foodEntries.filter(
    (e) => typeof e.confidence === 'number' && e.confidence > 0 && e.confidence < 0.7,
  ).length;
  if (lowConfidence > 0) {
    issues.push({ severity: 'warning', label: 'Low confidence', count: lowConfidence, detail: 'food entries with confidence below 0.7' });
  }

  const needsReview = foodEntries.filter((e) => e.needs_review === true).length;
  if (needsReview > 0) {
    issues.push({ severity: 'warning', label: 'Needs review', count: needsReview, detail: 'food entries flagged for manual review' });
  }

  const foodDateSet = new Set(foodEntries.map((e) => e.entry_date));
  const weightOnlyDays = weightEntries.filter((e) => e.entry_date && !foodDateSet.has(e.entry_date)).length;
  if (weightOnlyDays > 0) {
    issues.push({ severity: 'info', label: 'Weight without intake', count: weightOnlyDays, detail: 'days with weight logged but no food entries' });
  }

  const sortedFood = [...foodEntries].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
  let duplicateLike = 0;
  for (let i = 1; i < sortedFood.length; i++) {
    const prev = sortedFood[i - 1];
    const curr = sortedFood[i];
    if (
      prev.entry_date === curr.entry_date &&
      prev.estimated_calories === curr.estimated_calories &&
      Math.abs(new Date(curr.logged_at).getTime() - new Date(prev.logged_at).getTime()) < 2 * 60 * 1000
    ) {
      duplicateLike++;
    }
  }
  if (duplicateLike > 0) {
    issues.push({ severity: 'warning', label: 'Possible duplicates', count: duplicateLike, detail: 'food entries with identical calories logged within 2 minutes' });
  }

  const badSummaries = dailySummaries.filter(
    (s) => (s.food_entries ?? 0) > 0 && (s.total_calories ?? 0) === 0,
  ).length;
  if (badSummaries > 0) {
    issues.push({ severity: 'error', label: 'Zero-calorie days', count: badSummaries, detail: 'days with food entries but showing 0 kcal total' });
  }

  return issues.sort((a, b) => ({ error: 0, warning: 1, info: 2 }[a.severity] - { error: 0, warning: 1, info: 2 }[b.severity]));
}

function IssueRow({ issue }: { issue: Issue }) {
  const Icon = issue.severity === 'error' ? XCircle : issue.severity === 'warning' ? AlertTriangle : Info;
  const colorClass =
    issue.severity === 'error' ? 'text-destructive' : issue.severity === 'warning' ? 'text-amber-500' : 'text-muted-foreground';
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <div className="flex items-start gap-2 min-w-0">
        <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colorClass}`} />
        <div className="min-w-0">
          <span className="text-sm font-medium">{issue.label}</span>
          {issue.detail && <p className="text-[11px] text-muted-foreground">{issue.detail}</p>}
        </div>
      </div>
      <Badge
        variant={issue.severity === 'error' ? 'destructive' : issue.severity === 'warning' ? 'outline' : 'secondary'}
        className={`shrink-0 text-[10px] px-1.5 h-5 ${issue.severity === 'warning' ? 'border-amber-500/40 text-amber-500' : ''}`}
      >
        {issue.count}
      </Badge>
    </div>
  );
}

export function DataHealthCard({ data }: { data: VaultData }) {
  const issues = useMemo(() => computeIssues(data), [data]);
  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warnCount = issues.filter((i) => i.severity === 'warning').length;
  const statusLabel = errorCount > 0 ? 'Issues found' : warnCount > 0 ? 'Warnings' : 'Clean';

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Data quality</div>
          <CardTitle className="text-lg flex items-center gap-2">
            {issues.length === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className={`w-4 h-4 ${errorCount > 0 ? 'text-destructive' : 'text-amber-500'}`} />
            )}
            Data health
          </CardTitle>
        </div>
        <Badge
          variant={errorCount > 0 ? 'destructive' : warnCount > 0 ? 'outline' : 'secondary'}
          className={warnCount > 0 && errorCount === 0 ? 'border-amber-500/40 text-amber-500' : ''}
        >
          {statusLabel}
        </Badge>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">
              No issues detected across {data.foodEntries.length} food entries and {data.weightEntries.length} weight entries.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {issues.map((issue) => (
              <IssueRow key={issue.label} issue={issue} />
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-3">
          {data.foodEntries.length} food · {data.weightEntries.length} weight · {data.dailySummaries.length} days
        </p>
      </CardContent>
    </Card>
  );
}
