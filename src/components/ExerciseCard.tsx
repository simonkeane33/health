'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import type { ExerciseEntry } from '@/lib/schemas';

function formatDuration(iso: string | undefined): string {
  if (!iso) return '-';
  const m = iso.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return iso;
  const [_, h, min, s] = m;
  const parts: string[] = [];
  if (Number(h) > 0) parts.push(`${Number(h)}h`);
  if (Number(min) > 0) parts.push(`${Number(min)}m`);
  if (Number(s) > 0) parts.push(`${Number(s)}s`);
  return parts.join(' ');
}

interface ExerciseCardProps {
  entries: ExerciseEntry[];
}

export function ExerciseCard({ entries }: ExerciseCardProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Exercise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
            <Activity className="h-8 w-8 opacity-30" />
            <p className="text-sm">No exercise entries found in the loaded vault.</p>
            <p className="text-[11px]">Log an exercise note in Obsidian and reload the folder.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = entries[0];
  const totalActivities = entries.length;
  const totalDistance = entries.reduce((acc, e) => acc + (e.distance_km ?? 0), 0);
  const totalCalories = entries.reduce((acc, e) => acc + (e.calories_burned ?? 0), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <div>
            <CardDescription>Exercise</CardDescription>
            <CardTitle>Activity</CardTitle>
          </div>
        </div>
        <Badge variant="outline">{totalActivities} entries</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground">Latest</div>
            <strong className="block text-lg tabular-nums">{latest.activity_type}</strong>
            <p className="text-xs text-muted-foreground">{latest.entry_date}</p>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground">Distance</div>
            <strong className="block text-lg tabular-nums">{totalDistance.toFixed(1)} km</strong>
            <p className="text-xs text-muted-foreground">Total recorded</p>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground">Calories</div>
            <strong className="block text-lg tabular-nums">{totalCalories.toLocaleString()} kcal</strong>
            <p className="text-xs text-muted-foreground">Burned total</p>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground">Duration</div>
            <strong className="block text-lg tabular-nums">{formatDuration(latest.moving_time)}</strong>
            <p className="text-xs text-muted-foreground">Latest session</p>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="text-xs font-medium uppercase text-muted-foreground mb-2">Recent sessions</div>
          <div className="space-y-2">
            {entries.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{e.activity_type}</span>
                  <span className="text-muted-foreground">{e.course_or_route}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
                  <span>{e.distance_km?.toFixed(1)} km</span>
                  <span>{formatDuration(e.moving_time)}</span>
                  <span>{e.calories_burned} kcal</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
