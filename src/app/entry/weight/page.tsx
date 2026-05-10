import WeightEntryForm from '@/components/forms/WeightEntryForm';

export default function WeightEntryPage() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Log Weight</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Record a weight entry and download the Markdown file.
          </p>
        </div>
        <WeightEntryForm />
      </div>
    </div>
  );
}
