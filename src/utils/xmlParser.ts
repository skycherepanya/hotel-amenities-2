import type { GuestData } from '../types';

export function parseGuestPreferences(xmlString: string): GuestData[] {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  // Шукаємо всі блоки з даними про гостей
  const guestNodes = xmlDoc.getElementsByTagName("G_FULL_NAME");

  // Використовуємо Map, щоб групувати дані за Reservation ID
  const guestsMap = new Map<string, GuestData>();

  for (let i = 0; i < guestNodes.length; i++) {
    const node = guestNodes[i];

    // Витягуємо текст з тегів
    const resvNameId = node.getElementsByTagName("RESV_NAME_ID")[0]?.textContent?.trim() || "";
    const room = node.getElementsByTagName("ROOM")[0]?.textContent?.trim() || "";
    const fullName = node.getElementsByTagName("FULL_NAME")[0]?.textContent?.trim() || "";
    const vipStatus = node.getElementsByTagName("VIP_STATUS")[0]?.textContent?.trim() || "";
    const arrival = node.getElementsByTagName("ARRIVAL")[0]?.textContent?.trim() || "";

    // Якщо це пуста кімната або немає ID - пропускаємо
    if (!resvNameId || !room) continue;

    // ФІЛЬТР: Ми обробляємо тільки VIP гостей (якщо статус порожній - ігноруємо)
    if (!vipStatus) continue;

    // Очищаємо ім'я від зірочок
    const cleanFullName = fullName.replace(/^\*/, '');

    // Якщо ми ще не додали цього гостя, додаємо (ми більше не парсимо PREFERENCE_DESC)
    if (!guestsMap.has(resvNameId)) {
      guestsMap.set(resvNameId, {
        resvNameId,
        room,
        fullName: cleanFullName,
        vipStatus,
        arrival,
        preferences: [] // We don't save preferences anymore, using vip_status column
      });
    }
  }

  // Перетворюємо наш Map назад у звичайний масив, який зручно мапити в React
  return Array.from(guestsMap.values());
}