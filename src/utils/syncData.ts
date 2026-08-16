import { supabase } from '../api/supabaseClient';
import type { GuestData } from '../types';

export async function syncData(newParsedData: GuestData[]) {
  console.log("🔄 Починаємо синхронізацію з базою даних...", newParsedData.length, "записів");

  // 1. Отримуємо існуючі записи
  const { data: existingTasks, error: fetchError } = await supabase
    .from('amenities_tasks')
    .select('id, reservation_id, room_number, status');

  if (fetchError) {
    console.error('❌ Помилка завантаження з бази під час синхронізації:', fetchError);
    return false;
  }

  // 2. Створюємо Map для швидкого пошуку існуючих завдань за reservation_id
  const existingMap = new Map();
  for (const task of (existingTasks || [])) {
    if (task.reservation_id) {
      existingMap.set(String(task.reservation_id), task);
    }
  }

  // 2.5 Дедуплікація вхідних даних (якщо в файлах були дублікати однієї броні)
  const deduplicatedData = new Map<string, GuestData>();
  for (const guest of newParsedData) {
    deduplicatedData.set(guest.resvNameId, guest);
  }

  let insertedCount = 0;
  let updatedCount = 0;

  // 3. Проходимо по нових даних і формуємо масиви для INSERT та UPDATE
  for (const guest of deduplicatedData.values()) {
    const existing = existingMap.get(guest.resvNameId);

    if (!existing) {
      // Нове завдання - робимо INSERT
      const { error: insertError } = await supabase
        .from('amenities_tasks')
        .insert({
          reservation_id: guest.resvNameId,
          room_number: guest.room,
          guest_name: guest.fullName,
          amenities_json: [],
          vip_status: guest.vipStatus,
          arrival_date: guest.arrival,
          status: 'pending' // Нове завдання завжди pending
        });

      if (insertError) {
        console.error('❌ Insert error for reservation', guest.resvNameId, ':', insertError);
      } else {
        insertedCount++;
      }
    } else {
      // Завдання існує - Оновлюємо дані
      const updatePayload: any = {
        guest_name: guest.fullName,
        amenities_json: [], // Clear any garbage OTA BOOKING tags
        vip_status: guest.vipStatus
      };

      if (String(existing.room_number) !== String(guest.room)) {
        console.log(`⚠️ Кімнату змінено для ${guest.fullName}: ${existing.room_number} -> ${guest.room}`);
        updatePayload.room_number = guest.room;
        updatePayload.status = 'room_move';
      }

      const { error: updateError } = await supabase
        .from('amenities_tasks')
        .update(updatePayload)
        .eq('reservation_id', guest.resvNameId);

      if (updateError) {
        console.error('❌ Update error for reservation', guest.resvNameId, ':', updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`✅ Синхронізація завершена. Додано: ${insertedCount}, Оновлено кімнат: ${updatedCount}`);
  return true;
}
