import ZhafirParameterForm from '@/components/zhafir-ze-3600';

export default function ZhafirZE3600Page() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Zhafir ZE 3600 Parameters</h1>
      </div>
      <ZhafirParameterForm />
    </div>
  );
}