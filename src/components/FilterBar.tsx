interface FilterBarProps {
  activeFloor: string;
  onFloorChange: (floor: string) => void;
  // onAddCleanRoom та cleanCount видаляємо, вони більше не потрібні
  totalPendingCount: number; // Рахуємо скільки залишилось рознести
  deliveredCount: number;
}

export default function FilterBar({
  activeFloor,
  onFloorChange,
  totalPendingCount,
  deliveredCount,
}: FilterBarProps) {
  const floors = ["All", "M", "1", "2", "3", "4", "5"];

  return (
    <div>
      {/* Статистика */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium text-gray-600">
          Delivered:{" "}
          <span className="text-green-600 font-bold">{deliveredCount}</span> /
          Pending:{" "}
          <span className="text-blue-600 font-bold">{totalPendingCount}</span>
        </div>
      </div>

      {/* Фільтри поверхів залишаються без змін */}
      <div className="flex flex-wrap gap-2">
        {floors.map((floor) => (
          <button
            key={floor}
            type="button"
            onClick={() => onFloorChange(floor)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeFloor === floor
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {floor === "All" ? "All" : floor === "M" ? "M" : `Fl ${floor}`}
          </button>
        ))}
      </div>
    </div>
  );
}