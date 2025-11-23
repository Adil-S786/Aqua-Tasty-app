export default function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white/75 backdrop-blur-lg shadow-[0_6px_18px_rgba(0,80,90,0.18)] rounded-2xl p-3 flex flex-col items-center justify-center text-[#055f6a]">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xl font-semibold mt-1">{value}</span>
    </div>
  );
}