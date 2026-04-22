import { format } from "date-fns";

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];

export function dayName(date: Date) {
  return DAY_NAMES[date.getDay()];
}

export function longIndonesianDate(date: Date) {
  return `${dayName(date)}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function compactIndonesianDate(date: Date) {
  return `${dayName(date)} (${date.getDate()}/${date.getMonth() + 1})`;
}

export function articleTitleDate(date: Date) {
  return format(date, "dd MMMM yyyy");
}

export function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);
}
