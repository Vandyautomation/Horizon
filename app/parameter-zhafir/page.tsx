import ZhafirParameter from '@/components/zhafir-parameter';

export default function ZhafirParameterPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Zhafir Parameters</h1>
      </div>
      <ZhafirParameter />
    </div>
  );
}