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

    // Витягуємо текст з тегів, якщо тегу немає — ставимо пустий рядок
    const resvNameId = node.getElementsByTagName("RESV_NAME_ID")[0]?.textContent?.trim() || "";
    const room = node.getElementsByTagName("ROOM")[0]?.textContent?.trim() || "";
    const fullName = node.getElementsByTagName("FULL_NAME")[0]?.textContent?.trim() || "";
    const vipStatus = node.getElementsByTagName("VIP_STATUS")[0]?.textContent?.trim() || "";
    const arrival = node.getElementsByTagName("ARRIVAL")[0]?.textContent?.trim() || "";
    const preference = node.getElementsByTagName("PREFERENCE_DESC")[0]?.textContent?.trim() || "";

    // Якщо це пуста кімната або немає ID - пропускаємо
    if (!resvNameId || !room) continue;

    // Очищаємо ім'я від зірочок (часто Опера додає * перед прізвищем)
    const cleanFullName = fullName.replace(/^\*/, '');

    // Перевіряємо, чи ми вже додали цього гостя в наш Map
    if (guestsMap.has(resvNameId)) {
      // Якщо гість вже є, просто додаємо нову преференцію до його списку
      const existingGuest = guestsMap.get(resvNameId)!;
      if (preference && !existingGuest.preferences.includes(preference)) {
        existingGuest.preferences.push(preference);
      }
      // Якщо раптом у попередньому рядку не було VIP статусу, а тут є - оновлюємо
      if (!existingGuest.vipStatus && vipStatus) {
        existingGuest.vipStatus = vipStatus;
      }
    } else {
      // Якщо це новий гість, створюємо для нього запис
      guestsMap.set(resvNameId, {
        resvNameId,
        room,
        fullName: cleanFullName,
        vipStatus,
        arrival,
        preferences: preference ? [preference] : []
      });
    }
  }

  // Перетворюємо наш Map назад у звичайний масив, який зручно мапити в React
  return Array.from(guestsMap.values());
}