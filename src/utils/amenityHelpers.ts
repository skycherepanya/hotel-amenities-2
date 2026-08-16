export function getAmenityColor(name: string | undefined | null): string {
  const lower = String(name || "").toLowerCase();
  const normalized = lower.replace(/vip\s*0+(\d)/g, 'vip $1');

  if (normalized.includes("vip 1")) return "bg-purple-200 text-purple-800";
  if (normalized.includes("vip 2")) return "bg-yellow-200 text-yellow-800";
  if (normalized.includes("vip 3")) return "bg-orange-200 text-orange-800";
  if (normalized.includes("vip 4")) return "bg-sky-200 text-sky-800";
  if (normalized.includes("vip 5")) return "bg-green-200 text-green-800";
  if (normalized.includes("vip 6")) return "bg-pink-200 text-pink-800";
  if (normalized.includes("vip 7")) return "bg-violet-300 text-violet-900";
  if (normalized.includes("kid")) return "bg-pink-200 text-pink-800";

  return "bg-gray-200 text-gray-800";
}
