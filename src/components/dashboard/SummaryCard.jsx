export default function SummaryCard({ title, value, subtitle, color }) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <p className="text-sm text-gray-500">{title}</p>
        <h2 className={`text-2xl font-bold mt-2 ${color}`}>{value}</h2>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </div>
    );
  }