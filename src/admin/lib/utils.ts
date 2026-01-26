import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getBackendUrl = () => {
  const envBackendUrl = process.env.BACKEND_URL;
  if (envBackendUrl && envBackendUrl !== "/") {
    return `${envBackendUrl}/admin`;
  }
  return `${window.location.origin}/admin`;
};

const LOCALE = enUS;

export const getFullDate = ({
  date,
  includeTime = false,
}: {
  date: string | Date;
  includeTime?: boolean;
}) => {
  const ensuredDate = new Date(date);

  if (isNaN(ensuredDate.getTime())) {
    return "";
  }

  const timeFormat = includeTime ? "p" : "";

  return format(ensuredDate, `PP ${timeFormat}`, {
    locale: LOCALE,
  });
};
