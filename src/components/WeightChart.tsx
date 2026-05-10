'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { WeightEntry } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  entries: WeightEntry[];
  range?: '7' | '14' | '30' | '90' | '365' | 'all';
}

export function WeightChart({ entries, range = 'all' }: Props) {
  const filtered = range === 'all'
    ? entries
    : entries.filter((e) => {
        const days = parseInt(range);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return new Date(e.entry_date) >= cutoff;
      });

  const chronological = [...filtered].reverse();

  const labels = chronological.map((e) =>
    new Date(e.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  );

  const dataPoints = chronological.map((e) => e.weight_kg);

  const data = {
    labels,
    datasets: [
      {
        label: 'Weight (kg)',
        data: dataPoints,
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.08)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 10 },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  );
}
