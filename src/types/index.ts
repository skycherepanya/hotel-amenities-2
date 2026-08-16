export interface Amenity {
  name: string;
  time: string | null;
  note: string;
}

export interface RoomData {
  roomNumber: string;
  guestName: string;
  amenities: Amenity[];
  hkStatus?: string;
  foStatus?: string;
  resvStatus?: string;
  arrivalDate?: string;
  departureDate?: string;
  reservationId?: string;
  status?: string;
}

export interface GuestData {
  resvNameId: string;
  room: string;
  fullName: string;
  vipStatus: string;
  arrival: string;
  preferences: string[];
}