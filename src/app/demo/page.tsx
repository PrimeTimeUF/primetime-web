import ButtonExamples from "@/components/Button.example";

export default function ComponentDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <h1 className="text-2xl font-bold">PrimeTime Component Demo</h1>
          <p className="text-sm text-gray-500 mt-1">
            Button component examples and usage patterns
          </p>
        </div>
      </header>
      <ButtonExamples />
    </div>
  );
}
