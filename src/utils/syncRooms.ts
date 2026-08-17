import { supabase } from '../api/supabaseClient';

export interface ParsedRoom {
  room_number: string;
  hk_status: string;
}

export function parseHkRooms(xmlString: string): ParsedRoom[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  let roomNodes = xmlDoc.getElementsByTagName("G_ROOM_NUMBER");
  if (roomNodes.length === 0) {
    roomNodes = xmlDoc.getElementsByTagName("G_ROOM");
  }
  const roomsMap = new Map<string, ParsedRoom>();

  for (let i = 0; i < roomNodes.length; i++) {
    const node = roomNodes[i];
    const room = node.getElementsByTagName("ROOM")[0]?.textContent?.trim();
    const status = node.getElementsByTagName("ROOM_STATUS")[0]?.textContent?.trim();

    if (room && status) {
      // Convert Opera codes to readable text
      let readableStatus = status;
      if (status === 'IP') readableStatus = 'Inspected';
      else if (status === 'CL') readableStatus = 'Clean';
      else if (status === 'DI') readableStatus = 'Dirty';
      else if (status === 'PU') readableStatus = 'Pick Up';
      else if (status === 'OO') readableStatus = 'Out of Order';
      else if (status === 'OS') readableStatus = 'Out of Service';

      roomsMap.set(room, {
        room_number: room,
        hk_status: readableStatus
      });
    }
  }

  return Array.from(roomsMap.values());
}

export async function syncRoomsToDb(rooms: ParsedRoom[]) {
  console.log(`🔄 Синхронізація ${rooms.length} кімнат з БД...`);

  if (rooms.length === 0) return true;

  const { error } = await supabase
    .from('rooms')
    .upsert(rooms, { onConflict: 'room_number' });

  if (error) {
    console.error('❌ Помилка синхронізації кімнат:', error);
    return false;
  }

  console.log('✅ Кімнати успішно синхронізовано!');
  return true;
}
