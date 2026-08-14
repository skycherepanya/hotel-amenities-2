import { Check } from "lucide-react";
import type { RoomData } from "../types";
import { getAmenityColor } from "../utils/amenityHelpers";

interface RoomCardProps {
  room: RoomData;
  isDelivered: boolean;
  isPending: boolean;
  onDeliver: (roomNumber: string) => void;
}

export default function RoomCard({
  room,
  isDelivered,
  isPending,
  onDeliver,
}: RoomCardProps) {
  const primaryAmenity = room.amenities[0];
  const displayTime = room.amenities.find((a) => a.time)?.time ?? null;
  const displayNote =
    room.amenities
      .map((a) => a.note)
      .filter(Boolean)
      .join(" · ") || null;

  return (
    <div
      className={`flex items-center gap-2 p-2 border-b border-gray-100 last:border-b-0 transition-all ${
        isDelivered
          ? "bg-green-50 opacity-60"
          : isPending
            ? "opacity-50"
            : "bg-white"
      }`}
    >
      {/* Ліва частина: Номер кімнати та теги */}
      <div className="shrink-0 w-18">
        <div
          className={`font-bold text-lg leading-tight ${
            isDelivered ? "line-through text-gray-500" : "text-gray-900"
          }`}
        >
          {room.roomNumber}
        </div>
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {room.amenities.map((amenity, idx) => (
            <span
              key={idx}
              className={`px-1 py-0.5 rounded text-[10px] font-bold uppercase leading-none ${getAmenityColor(
                amenity.name,
              )}`}
            >
              {amenity.name || "?"}
            </span>
          ))}
        </div>
      </div>

      {/* Середня частина: Час, нотатки, ім'я */}
      <div className="flex-1 min-w-0">
        {displayTime && (
          <div className="text-xs font-semibold text-red-600 leading-tight">
            {displayTime}
          </div>
        )}
        {displayNote && (
          <div className="text-xs text-gray-500 leading-tight truncate">
            {displayNote}
          </div>
        )}
        {!displayTime && !displayNote && primaryAmenity && (
          <div className="text-xs text-gray-400 leading-tight">
            {room.guestName || "—"}
          </div>
        )}
      </div>

      {/* Права частина: Кнопка "Доставлено" */}
      <button
        type="button"
        onClick={() => onDeliver(room.roomNumber)}
        disabled={isDelivered || isPending}
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          isDelivered
            ? "bg-green-200 text-green-700 cursor-default"
            : isPending
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        <Check className="w-5 h-5" />
      </button>
    </div>
  );
}
