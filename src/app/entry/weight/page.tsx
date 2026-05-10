import WeightEntryForm from '@/components/forms/WeightEntryForm';

export default function WeightEntryPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground h-8 w-8">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3c2.5 0 4 1.5 4 3.5 0 1.4-.6 2.4-1.8 3.4 2.5.8 4.3 3 4.3 5.7 0 3.5-2.9 5.9-6.5 5.9S5.5 19.1 5.5 15.6c0-2.7 1.8-4.9 4.3-5.7C8.6 8.9 8 7.9 8 6.5 8 4.5 9.5 3 12 3Z" />
              <path d="M12 8.3v7.8" />
              <path d="M8.9 12.1H15" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Log Weight</h1>
            <p className="text-[11px] text-muted-foreground">Record a weight entry and download the Markdown file.</p>
          </div>
        </div>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to dashboard</a>
      </header>
      <div className="p-6 lg:p-8">
        <div className="max-w-xl mx-auto space-y-6">
          <WeightEntryForm />
        </div>
      </div>
    </div>
  );
}
