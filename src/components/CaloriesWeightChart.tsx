'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { useMemo } from 'react';
import type { DailySummary } from '@/lib/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend
);

interface Props {
  summaries: DailySummary[];
  range: '7' | '14' | '30' | '90' | '365' | 'all';
  theme: 'light' | 'dark';
}

const CHART_COLORS = {
  light: {
    primary: '#01696f',
    error: '#a12c7b',
    text: '#28251d',
    muted: '#68655f',
    border: 'rgba(40,37,29,0.10)',
    tooltipBg: '#f9f8f5',
  },
  dark: {
    primary: '#4f98a3',
    error: '#d163a7',
    text: '#cdccca',
    muted: '#a29f99',
    border: 'rgba(205,204,202,0.10)',
    tooltipBg: '#1c1b19',
  },
};

export function CaloriesWeightChart({ summaries, range, theme }: Props) {
  const colors = CHART_COLORS[theme];

  const { labels, calories, weight, count } = useMemo(() => {
    const filtered = range === 'all'
      ? [...summaries].sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime())
      : (() => {
          const days = parseInt(range, 10);
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - days);
          return summaries
            .filter((s) => new Date(s.entry_date) >= cutoff)
            .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
        })();

    return {
      labels: filtered.map((s) =>
        new Date(s.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      ),
      calories: filtered.map((s) => s.total_calories ?? 0),
      weight: filtered.map((s) => (s.weight_kg == null ? null : Number(s.weight_kg))),
      count: filtered.length,
    };
  }, [summaries, range]);

  if (count === 0) {
    return (
      <div className="h-80 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50">
        <p className="text-sm text-slate-500">No data available for the selected range.</p>
      </div>
    );
  }

  const data = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Calories',
        data: calories,
        yAxisID: 'yCalories',
        backgroundColor: colors.primary,
        borderRadius: 10,
        maxBarThickness: 28,
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Weight (kg)',
        data: weight,
        yAxisID: 'yWeight',
        borderColor: colors.error,
        backgroundColor: colors.error,
        tension: 0.32,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        order: 1,
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: colors.text,
          usePointStyle: true,
          boxWidth: 10,
          font: { size: 12, family: 'inherit' },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.text,
        bodyColor: colors.text,
        borderColor: colors.border,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        ticks: {
          color: colors.muted,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          font: { size: 11 },
        },
        grid: { display: false },
        border: { display: false },
      },
      yCalories: {
        position: 'left',
        beginAtZero: true,
        ticks: { color: colors.muted, font: { size: 11 } },
        grid: { color: colors.border },
        border: { display: false },
        title: {
          display: true,
          text: 'kcal',
          color: colors.muted,
          font: { size: 10 },
        },
      },
      yWeight: {
        position: 'right',
        ticks: { color: colors.muted, font: { size: 11 } },
        grid: { drawOnChartArea: false },
        border: { display: false },
        title: {
          display: true,
          text: 'kg',
          color: colors.muted,
          font: { size: 10 },
        },
      },
    },
  };

  return (
    <div className="w-full">
      <div className="relative w-full h-80">
        <Chart type="bar" data={data} options={options} />
      </div>
      <p className="text-xs text-slate-500 mt-2 text-right">
        {count} tracked day{count === 1 ? '' : 's'} in view
      </p>
    </div>
  );
}
