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
  const displayRoomNumber = room.roomNumber.startsWith("0")
    ? "M" + room.roomNumber.substring(1)
    : room.roomNumber;
  const primaryAmenity = room.amenities[0];
  const displayTime = room.amenities.find((a) => a.time)?.time ?? null;
  const displayNote =
    room.amenities
      .map((a) => a.note)
      .filter(Boolean)
      .join(" · ") || null;

  return (
    <div
      className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${isDelivered
        ? "bg-gray-50/80 border-gray-200 opacity-60 grayscale-[0.5]"
        : isPending
          ? "bg-white border-blue-200 shadow-md opacity-50 scale-[0.98]"
          : room.status === "room_move"
            ? "bg-red-50/80 border-red-200 shadow-sm"
            : "bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5"
        }`}
    >
      {room.status === "room_move" && !isDelivered && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl shadow-sm z-10 tracking-wider">
          ROOM MOVE
        </div>
      )}

      {/* Ліва частина: Номер кімнати та теги */}
      <div className="shrink-0 w-20 flex flex-col gap-1.5">
        <div className="flex items-baseline gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Room</span>
          <div
            className={`font-black text-xl tracking-tight ${isDelivered ? "line-through text-gray-400" : "text-slate-800"
              }`}
          >
            {displayRoomNumber}
          </div>
          {room.hkStatus && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
              room.hkStatus === 'Clean' ? 'bg-emerald-100 text-emerald-700' :
              room.hkStatus === 'Inspected' ? 'bg-blue-100 text-blue-700' :
              room.hkStatus === 'Dirty' ? 'bg-rose-100 text-rose-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {room.hkStatus}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {room.resvStatus === "CKIN" && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm border border-black/5 bg-indigo-100 text-indigo-700">
              IH
            </span>
          )}
          {room.vipStatus && (
            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm border border-black/5 ${getAmenityColor("VIP " + room.vipStatus)}`}>
              VIP {room.vipStatus}
            </span>
          )}
          {room.amenities
            .filter((a) => getAmenityColor(a.name) !== "bg-gray-200 text-gray-800")
            .map((amenity, idx) => (
              <span
                key={idx}
                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm border border-black/5 ${getAmenityColor(
                  amenity.name,
                )}`}
              >
                {amenity.name || "?"}
              </span>
            ))}
        </div>
      </div>

      {/* Середня частина: Час, нотатки, ім'я */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 pl-3 border-l border-gray-100 py-0.5">
        {displayTime && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 w-fit px-2 py-0.5 rounded-md border border-rose-100/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            {displayTime}
          </div>
        )}
        {displayNote && (
          <div className="text-[13px] text-slate-700 font-medium leading-snug line-clamp-3">
            {displayNote}
          </div>
        )}
        {!displayTime && !displayNote && primaryAmenity && (
          <div className="text-[13px] text-slate-400 italic font-medium">
            {room.guestName || "No additional preferences"}
          </div>
        )}
      </div>

      {/* Права частина: Кнопка "Доставлено" */}
      <button
        type="button"
        onClick={() => onDeliver(room.roomNumber)}
        disabled={isDelivered || isPending || room.hkStatus === 'Dirty'}
        className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ml-2 ${isDelivered
          ? "bg-emerald-100 text-emerald-600 cursor-default"
          : isPending
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : room.hkStatus === 'Dirty'
              ? "bg-rose-50 text-rose-300 border border-rose-200 cursor-not-allowed opacity-60"
              : "bg-gradient-to-br from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          }`}
      >
        <Check className={`w-6 h-6 ${isDelivered ? "opacity-100" : "opacity-90"}`} strokeWidth={isDelivered ? 3 : 2.5} />
      </button>
    </div>
  );
}
