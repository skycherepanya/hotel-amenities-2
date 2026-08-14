import { useState } from "react";

interface FilterBarProps {
  activeFloor: string;
  onFloorChange: (floor: string) => void;
  onAddCleanRoom: (roomNumber: string) => void;
  cleanCount: number;
  deliveredCount: number;
}

export default function FilterBar({
  activeFloor,
  onFloorChange,
  onAddCleanRoom,
  cleanCount,
  deliveredCount,
}: FilterBarProps) {
  // Локальний стан для інпуту
  const [roomInput, setRoomInput] = useState("");

  // Жорстко зашиті поверхи за нашими правилами
  const floors = ["All", "M", "1", "2", "3", "4", "5"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = roomInput.trim();
    if (trimmed) {
      onAddCleanRoom(trimmed);
      setRoomInput(""); // Очищаємо інпут після додавання
    }
  };

  return (
    <div>
      {/* Форма вводу чистої кімнати */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          placeholder="Enter room number..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Add Clean
        </button>
      </form>

      {/* Статистика */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium text-gray-600">
          Delivered:{" "}
          <span className="text-green-600 font-bold">{deliveredCount}</span> /
          Total Clean:{" "}
          <span className="text-blue-600 font-bold">{cleanCount}</span>
        </div>
      </div>

      {/* Фільтри поверхів (Компактний мобільний дизайн) */}
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
