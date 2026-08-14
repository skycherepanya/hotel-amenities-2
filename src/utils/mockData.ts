import type { RoomData } from "../types";

export const mockRooms: RoomData[] = [
  {
    roomNumber: "020",
    guestName: "John Doe",
    amenities: [
      { name: "VIP 1", time: null, note: "Birthday" },
      { name: "Wine", time: null, note: "" },
    ],
  },
  {
    roomNumber: "405",
    guestName: "Jane Smith",
    amenities: [{ name: "Kid", time: "14:00", note: "Needs extra towels" }],
  },
];
