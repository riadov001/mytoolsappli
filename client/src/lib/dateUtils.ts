import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";

export function parseWithoutTimezoneShift(dateInput: string | Date): Date {
  if (dateInput instanceof Date) return dateInput;
  const cleanedDate = dateInput.replace('Z', '').replace(/\+\d{2}:\d{2}$/, '').replace(/\.\d{3}$/, '');
  const [datePart, timePart] = cleanedDate.split('T');
  if (!datePart) return new Date(dateInput);
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours = 0, minutes = 0, seconds = 0] = (timePart || '00:00:00').split(':').map(Number);
  
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function toDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  return parseWithoutTimezoneShift(dateInput);
}

export function formatLocalTime(dateInput: string | Date | null | undefined): string {
  const date = toDate(dateInput);
  if (!date) return "";
  return format(date, 'HH:mm');
}

export function formatLocalDate(dateInput: string | Date | null | undefined): string {
  const date = toDate(dateInput);
  if (!date) return "";
  return format(date, 'dd/MM/yyyy', { locale: fr });
}

export function formatLocalDateTime(dateInput: string | Date | null | undefined): string {
  const date = toDate(dateInput);
  if (!date) return "";
  return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
}

export function toDatetimeLocalValue(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = toDate(dateInput);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDatetimeLocalValue(value: string): Date {
  return new Date(value);
}
