import { RefreshCw } from "lucide-react";

interface HeaderProps {
  viewMode: "ready" | "all";
  onToggleView: () => void;
  onResetDay: () => void;
}

export default function Header({ viewMode, onToggleView, onResetDay }: HeaderProps) {
  return (
    <div className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-20">
      <h1 className="text-xl font-bold text-gray-800">Hotel Amenities</h1>
      
      <div className="flex items-center gap-2">
        {/* Кнопка перемикання виду */}
        <button
          type="button"
          onClick={onToggleView}
          className="text-gray-700 flex items-center text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"
        >
          {viewMode === "ready"
            ? "View: Ready to Deliver"
            : "View: All Amenities"}
        </button>
        
        {/* Кнопка скидання */}
        <button
          onClick={onResetDay}
          className="text-red-600 flex items-center text-sm font-medium border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset Day
        </button>
      </div>
    </div>
  );
}