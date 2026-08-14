import { useEffect, useState, useRef } from "react";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import RoomCard from "./components/RoomCard";
import type { RoomData } from "./types";
import { supabase } from "./api/supabaseClient"; // Підключаємо твій клієнт Supabase

export default function App() {
  // 1. Стан додатку (Тепер дані живуть у хмарі)
  const [dbRooms, setDbRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Тимчасово залишаємо локальні статуси для сумісності з поточним UI,
  // поки не перенесемо логіку "Delivered" в базу (Таска 1.6)
  const [cleanRooms, setCleanRooms] = useState<string[]>(() => {
    const saved = localStorage.getItem("cleanRooms");
    return saved ? JSON.parse(saved) : [];
  });

  const [deliveredRooms, setDeliveredRooms] = useState<string[]>(() => {
    const saved = localStorage.getItem("deliveredRooms");
    return saved ? JSON.parse(saved) : [];
  });

  const [viewMode, setViewMode] = useState<"ready" | "all">("ready");
  const [activeFloor, setActiveFloor] = useState<string>("All");
  const [pendingDeliveryRoom, setPendingDeliveryRoom] = useState<string | null>(
    null,
  );

  const deliveryTimerRef = useRef<number | null>(null);

  // 2. Завантаження даних із Supabase (Таска 1.5)

  useEffect(() => {
    let isMounted = true;

    const loadRooms = async () => {
      try {
        const { data, error } = await supabase
          .from("amenities_tasks")
          .select("*")
          .order("room_number", { ascending: true });

        console.log(data);

        if (error) throw error;

        if (isMounted) {
          // 1. Чесний тип: кажемо TS, що база може віддавати числа і null
          type SupabaseRow = {
            id: string | number;
            room_number: string | number;
            guest_name: string | null;
            amenities_json: RoomData["amenities"] | null;
            amenity_details?: RoomData["amenities"] | null;
            hk_status: string | null;
            fo_status: string | null;
            resv_status: string | null;
            arrival_date: string | null;
            departure_date: string | null;
          };

          // 2. Жорсткий перекладач: насильно робимо рядки і пусті масиви
          const formattedRooms = ((data as SupabaseRow[]) || []).map((row) => ({
            roomNumber: String(row.room_number || ""), // Примусово число 505 -> "505"
            guestName: String(row.guest_name || "Unknown Guest"), // Якщо null -> "Unknown Guest"
            amenities: row.amenities_json || row.amenity_details || [], // Якщо null -> []
            id: String(row.id),
            hkStatus: row.hk_status || "",
            foStatus: row.fo_status || "",
            resvStatus: row.resv_status || "",
            arrivalDate: row.arrival_date || "",
            departureDate: row.departure_date || "",
          }));

          setDbRooms(formattedRooms);
        }
      } catch (error) {
        const err = error as Error;
        console.error("Помилка завантаження з Supabase:", err.message);
        if (isMounted) {
          alert("Не вдалося завантажити дані з бази.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Збереження локальних статусів при змінах
  useEffect(() => {
    localStorage.setItem("cleanRooms", JSON.stringify(cleanRooms));
  }, [cleanRooms]);

  useEffect(() => {
    localStorage.setItem("deliveredRooms", JSON.stringify(deliveredRooms));
  }, [deliveredRooms]);

  // 4. Логіка бізнес-процесів
  const handleDeliver = async (roomNumber: string) => {
    if (pendingDeliveryRoom || deliveredRooms.includes(roomNumber)) return;
    if (!window.confirm(`Confirm delivery for room ${roomNumber}?`)) return;

    setPendingDeliveryRoom(roomNumber);

    try {
      // 1. Робимо UPDATE запит до Supabase
      const { error } = await supabase
        .from("amenities_tasks")
        .update({ status: "delivered" })
        .eq("room_number", roomNumber); // Шукаємо конкретну кімнату

      if (error) throw error;

      // 2. Якщо база успішно оновилася, застосовуємо наш візуальний фідбек
      if (deliveryTimerRef.current)
        window.clearTimeout(deliveryTimerRef.current);

      deliveryTimerRef.current = window.setTimeout(() => {
        setDeliveredRooms((prev) => [...prev, roomNumber]);
        setPendingDeliveryRoom(null);
      }, 500);
    } catch (error) {
      const err = error as Error;
      console.error("Помилка оновлення статусу:", err.message);
      alert("Не вдалося зберегти статус у базі даних.");

      // Скидаємо стан "завантаження" для кнопки, якщо сталася помилка
      setPendingDeliveryRoom(null);
    }
  };

  const handleAddCleanRoom = (roomNumber: string) => {
    if (roomNumber && !cleanRooms.includes(roomNumber)) {
      setCleanRooms((prev) => [...prev, roomNumber]);
    }
  };

  const handleResetDay = () => {
    if (
      window.confirm("Are you sure you want to reset all data for the day?")
    ) {
      if (deliveryTimerRef.current)
        window.clearTimeout(deliveryTimerRef.current);
      setCleanRooms([]);
      setDeliveredRooms([]);
      setViewMode("ready");
      setActiveFloor("All");
      setPendingDeliveryRoom(null);
      localStorage.clear();

      // Опціонально: можна додати fetchRooms() сюди, щоб оновити дані з бази
    }
  };

  // 5. Фільтрація карток для відображення
  const getRoomFloor = (roomNumber: string) => {
    const normalized = roomNumber.trim();
    if (normalized.startsWith("0")) return "M";
    return normalized.charAt(0);
  };

  const roomsToDisplay = dbRooms.filter((room) => {
    if (
      viewMode === "ready" &&
      (!cleanRooms.includes(room.roomNumber) ||
        deliveredRooms.includes(room.roomNumber))
    ) {
      return false;
    }
    const floor = getRoomFloor(room.roomNumber);
    if (activeFloor !== "All" && floor !== activeFloor) {
      return false;
    }
    return true;
  });

  // 6. Відображення UI
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600 font-medium">
        Завантаження бази...
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
      />

      <div className="max-w-md mx-auto p-4">
        <div className="sticky top-18 z-10 mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <FilterBar
            activeFloor={activeFloor}
            onFloorChange={setActiveFloor}
            onAddCleanRoom={handleAddCleanRoom}
            cleanCount={cleanRooms.length}
            deliveredCount={deliveredRooms.length}
          />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {roomsToDisplay.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-medium bg-gray-50">
              No rooms match the current filter.
            </div>
          ) : (
            roomsToDisplay.map((room) => (
              <RoomCard
                key={room.roomNumber} // Якщо в базі є ID, краще використовувати room.id
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
