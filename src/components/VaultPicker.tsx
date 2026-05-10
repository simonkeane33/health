'use client';

import { FolderOpen } from 'lucide-react';

interface Props {
  onPick: (files: FileList | null) => void;
}

export function VaultPicker({ onPick }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
      <FolderOpen className="w-10 h-10 text-slate-400" />
      <p className="text-slate-600 text-center max-w-sm">
        Select your <strong>01-Me/Health/</strong> folder to load weight and food data.
      </p>
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
        className="hidden"
        onChange={(e) => onPick(e.target.files)}
      />
      <button
        onClick={() => {
          const input = document.querySelector('input[type="file"]') as HTMLInputElement | null;
          input?.click();
        }}
        className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-full text-sm font-medium transition-colors"
      >
        Select vault folder
      </button>
      <p className="text-xs text-slate-400">
        Files stay on your device. Nothing is uploaded.
      </p>
    </div>
  );
}
