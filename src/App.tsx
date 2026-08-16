import { useEffect, useState, useRef } from "react";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import RoomCard from "./components/RoomCard";
import type { RoomData } from "./types";
import { supabase } from "./api/supabaseClient";
import { parseGuestPreferences } from "./utils/xmlParser";
import { syncData } from "./utils/syncData";

export default function App() {
  // 1. Стан додатку (Тепер дані живуть у хмарі)
  const [dbRooms, setDbRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deliveredRooms, setDeliveredRooms] = useState<string[]>(() => {
    const saved = localStorage.getItem("deliveredRooms");
    return saved ? JSON.parse(saved) : [];
  });

  const [viewMode, setViewMode] = useState<"ready" | "all">("ready");
  const [activeFloor, setActiveFloor] = useState<string>("All");
  const [pendingDeliveryRoom, setPendingDeliveryRoom] = useState<string | null>(
    null,
  );

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem("lastSyncTime") || null;
  });

  const deliveryTimerRef = useRef<number | null>(null);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("amenities_tasks")
        .select("*")
        .order("room_number", { ascending: true });

      if (error) throw error;

      if (data) {
        type SupabaseRow = {
          id: number;
          room_number: string;
          guest_name: string;
          amenities_json: any;
          hk_status: string | null;
          fo_status: string | null;
          resv_status: string | null;
          arrival_date: string | null;
          departure_date: string | null;
          reservation_id: string | null;
          status: string | null;
          vip_status: string | null;
        };

        const formattedRooms = ((data as SupabaseRow[]) || []).map((row) => {
          const rawAmenities = row.amenities_json || [];
          const parsedAmenities = rawAmenities.map((a: any) =>
            typeof a === "string" ? { name: a } : a,
          );

          return {
            id: String(row.id),
            roomNumber: String(row.room_number || "Unknown").padStart(3, "0"),
            guestName: row.guest_name || "Guest",
            amenities: parsedAmenities,
            hkStatus: row.hk_status || "",
            foStatus: row.fo_status || "",
            resvStatus: row.resv_status || "",
            arrivalDate: row.arrival_date || "",
            departureDate: row.departure_date || "",
            reservationId: row.reservation_id || "",
            status: row.status || "pending",
            vipStatus: row.vip_status || "",
          };
        });

        // Групування за номером кімнати
        const groupedRoomsMap = new Map<string, RoomData>();

        formattedRooms.forEach((room) => {
          if (!groupedRoomsMap.has(room.roomNumber)) {
            groupedRoomsMap.set(room.roomNumber, { ...room });
          } else {
            const existing = groupedRoomsMap.get(room.roomNumber)!;

            // Об'єднуємо імена, якщо вони різні
            if (!existing.guestName.includes(room.guestName)) {
              existing.guestName = `${existing.guestName} / ${room.guestName}`;
            }

            // Об'єднуємо VIP статуси
            if (!existing.vipStatus && room.vipStatus) {
              existing.vipStatus = room.vipStatus;
            } else if (existing.vipStatus && room.vipStatus && !existing.vipStatus.includes(room.vipStatus)) {
              existing.vipStatus = `${existing.vipStatus} & ${room.vipStatus}`;
            }

            // Додаємо аменіті
            existing.amenities = [...existing.amenities, ...room.amenities];
          }
        });

        const finalRooms = Array.from(groupedRoomsMap.values());
        setDbRooms(finalRooms as RoomData[]);
      }
    } catch (error) {
      const err = error as Error;
      console.error("Помилка завантаження з Supabase:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Завантаження та синхронізація даних
  useEffect(() => {
    fetchRooms();
  }, []);

  // FOR TESTING ONLY (Epic 3 Automation Test)
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).runTestSync = async () => {
        try {
          console.log("🧪 Запуск тестової синхронізації...");
          const guest1 = (await import('./.data/guest_preferences42254417.xml?raw')).default;
          const guest2 = (await import('./.data/guest_preferences42254638.xml?raw')).default;

          const guests = [...parseGuestPreferences(guest1), ...parseGuestPreferences(guest2)];

          await syncData(guests);
          await fetchRooms();
          console.log("✅ ТЕСТОВА СИНХРОНІЗАЦІЯ ЗАВЕРШЕНА!");
        } catch (e) {
          console.error("❌ Помилка тесту:", e);
        }
      };
      console.log("💡 Підказка: Викличте runTestSync() в консолі розробника, щоб протестувати файли.");
    }
  }, []);

  // 3. Збереження локальних статусів при змінах
  useEffect(() => {
    localStorage.setItem("deliveredRooms", JSON.stringify(deliveredRooms));
  }, [deliveredRooms]);

  useEffect(() => {
    if (lastSyncTime) {
      localStorage.setItem("lastSyncTime", lastSyncTime);
    } else {
      localStorage.removeItem("lastSyncTime");
    }
  }, [lastSyncTime]);

  // 4. Логіка бізнес-процесів
  const handleDeliver = async (roomNumber: string) => {
    if (pendingDeliveryRoom || deliveredRooms.includes(roomNumber)) return;
    if (!window.confirm(`Confirm delivery for room ${roomNumber}?`)) return;

    setPendingDeliveryRoom(roomNumber);

    try {
      const { error } = await supabase
        .from("amenities_tasks")
        .update({ status: "delivered" })
        .eq("room_number", roomNumber);

      if (error) throw error;

      if (deliveryTimerRef.current)
        window.clearTimeout(deliveryTimerRef.current);

      deliveryTimerRef.current = window.setTimeout(() => {
        setDeliveredRooms((prev) => [...prev, roomNumber]);
        setPendingDeliveryRoom(null);
      }, 500);
    } catch (error) {
      const err = error as Error;
      console.error("Помилка оновлення статусу:", err.message);
      alert("Failed to save status to the database.");
      setPendingDeliveryRoom(null);
    }
  };

  const handleResetDay = async () => {
    if (!window.confirm("Are you sure you want to reset all data for the day?"))
      return;
    if (
      !window.confirm(
        "WARNING: This will wipe today's synced progress in the database. Proceed?",
      )
    )
      return;

    if (deliveryTimerRef.current) window.clearTimeout(deliveryTimerRef.current);

    try {
      const { error } = await supabase
        .from("amenities_tasks")
        .update({ status: "pending" })
        .eq("status", "delivered");

      if (error) throw error;

      setDeliveredRooms([]);
      setViewMode("ready");
      setActiveFloor("All");
      setPendingDeliveryRoom(null);
      localStorage.removeItem("deliveredRooms");
      setLastSyncTime(null);

      alert("Database successfully reset to morning state!");
      await fetchRooms();
    } catch (error) {
      const err = error as Error;
      console.error("Error resetting database:", err.message);
      alert("Failed to reset database. Please check your internet connection.");
    }
  };

  // 5. Фільтрація карток для відображення
  const getRoomFloor = (roomNumber: string | number) => {
    const normalized = String(roomNumber).trim();
    if (normalized.startsWith("0")) return "M";
    return normalized.charAt(0);
  };

  const roomsToDisplay = dbRooms.filter((room) => {
    if (viewMode === "ready" && deliveredRooms.includes(room.roomNumber)) {
      return false;
    }

    const floor = getRoomFloor(room.roomNumber);
    if (activeFloor !== "All" && floor !== activeFloor) {
      return false;
    }
    return true;
  });

  const pendingCount = dbRooms.length - deliveredRooms.length;

  // 6. Відображення UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-slate-500 font-medium">
        Loading database...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header
        viewMode={viewMode}
        onToggleView={() =>
          setViewMode((prev) => (prev === "ready" ? "all" : "ready"))
        }
        onResetDay={handleResetDay}
        lastSyncTime={lastSyncTime}
      />

      <div className="max-w-md mx-auto p-4">
        <div className="sticky top-18 z-10 mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <FilterBar
            activeFloor={activeFloor}
            onFloorChange={setActiveFloor}
            totalPendingCount={pendingCount}
            deliveredCount={deliveredRooms.length}
          />
        </div>

        <div className="flex flex-col gap-3">
          {roomsToDisplay.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium bg-white rounded-xl border border-gray-200 shadow-sm">
              No rooms to display for this filter.
            </div>
          ) : (
            roomsToDisplay.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                isDelivered={deliveredRooms.includes(room.roomNumber)}
                isPending={pendingDeliveryRoom === room.roomNumber}
                onDeliver={handleDeliver}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
