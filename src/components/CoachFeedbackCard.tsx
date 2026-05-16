'use client';

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Lightbulb, Info, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { CoachFeedback, Insight } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  entries: CoachFeedback[];
  selectedDate?: string;
}

const TYPE_CONFIG = {
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-destructive',
    badgeVariant: 'destructive' as const,
    label: 'Warning',
  },
  suggestion: {
    icon: Lightbulb,
    iconClass: 'text-amber-400',
    badgeVariant: 'outline' as const,
    label: 'Suggestion',
  },
  positive: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    badgeVariant: 'secondary' as const,
    label: 'Positive',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-400',
    badgeVariant: 'outline' as const,
    label: 'Info',
  },
} as const;

const CATEGORY_LABEL: Record<string, string> = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
  fiber: 'Fiber',
  fluids: 'Fluids',
  alcohol: 'Alcohol',
  exercise: 'Exercise',
  weight: 'Weight',
  pattern: 'Pattern',
  general: 'General',
};

// Sort order: warnings first, then suggestions, then info, then positives
const TYPE_ORDER = { warning: 0, suggestion: 1, info: 2, positive: 3 };

function InsightRow({ insight }: { insight: Insight }) {
  const config = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.info;
  const Icon = config.icon;

  return (
    <li className="flex items-start gap-3 py-2.5 border-b border-border/60 last:border-0">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.iconClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{insight.message}</p>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 block">
          {CATEGORY_LABEL[insight.category] ?? insight.category}
        </span>
      </div>
      {insight.priority === 'high' && (
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0 mt-0.5">High</Badge>
      )}
    </li>
  );
}

function FeedbackPanel({ feedback }: { feedback: CoachFeedback }) {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...(feedback.insights ?? [])].sort(
    (a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9)
  );

  const highPriority = sorted.filter((i) => i.priority === 'high');
  const rest = sorted.filter((i) => i.priority !== 'high');
  const displayed = showAll ? sorted : sorted.slice(0, 4);
  const hasMore = sorted.length > 4;

  const warningCount = sorted.filter((i) => i.type === 'warning').length;
  const positiveCount = sorted.filter((i) => i.type === 'positive').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      {feedback.summary && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
          <Sparkles className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
          <p className="text-sm leading-relaxed text-foreground">{feedback.summary}</p>
        </div>
      )}

      {/* Insight list */}
      <ul className="flex flex-col">
        {displayed.map((insight, i) => (
          <InsightRow key={i} insight={insight} />
        ))}
      </ul>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground h-7"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? (
            <><ChevronUp className="w-3.5 h-3.5 mr-1" />Show less</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5 mr-1" />Show {sorted.length - 4} more insights</>
          )}
        </Button>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {warningCount > 0 && <Badge variant="destructive">{warningCount} warning{warningCount > 1 ? 's' : ''}</Badge>}
        {positiveCount > 0 && <Badge variant="secondary" className="text-emerald-600 dark:text-emerald-400">{positiveCount} positive{positiveCount > 1 ? 's' : ''}</Badge>}
        <span className="text-[11px] text-muted-foreground ml-auto">
          Generated {new Date(feedback.generated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export function CoachFeedbackCard({ entries, selectedDate }: Props) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const targetDate = selectedDate ?? todayStr;
  const targetFeedback = entries.find((e) => e.entry_date === targetDate);
  const latestFeedback = entries[0]; // most recent overall (sorted desc)
  // When using the time machine: show exact date match only (no fallback to latest)
  const feedback = selectedDate ? targetFeedback : (targetFeedback ?? latestFeedback);

  const isToday = targetDate === todayStr;

  if (!feedback) {
    const displayDate = targetDate === todayStr
      ? 'today'
      : new Date(targetDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Insights</div>
          <CardTitle className="text-lg mb-3">Coach feedback</CardTitle>
          <div className="flex items-start gap-3 py-2">
            <Sparkles className="w-5 h-5 text-muted-foreground/50 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">No feedback for {displayDate}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {targetDate === todayStr ? (
                  <>Ask Hermes: <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">/feedback</span> and it will analyse your intake and write insights here.</>
                ) : (
                  'No coach feedback note exists for this date in the vault.'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1">Insights</div>
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle className="text-lg">Coach feedback</CardTitle>
          {!isToday && (
            <Badge variant="outline" className="text-[10px]">
              {new Date(feedback.entry_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </Badge>
          )}
        </div>
        <CardDescription>
          {isToday
            ? "Today's analysis from Hermes"
            : selectedDate
            ? `Feedback for ${new Date(targetDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : 'Most recent feedback — run /feedback for today'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FeedbackPanel feedback={feedback} />
      </CardContent>
    </Card>
  );
}
