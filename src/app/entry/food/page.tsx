import FoodEntryForm from '@/components/forms/FoodEntryForm';

export default function FoodEntryPage() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Log Food / Drink</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Enter a meal or drink and download the Markdown entry.
          </p>
        </div>
        <FoodEntryForm />
      </div>
    </div>
  );
}
