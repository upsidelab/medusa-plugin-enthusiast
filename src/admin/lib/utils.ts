import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getBackendUrl = () => {
  const envBackendUrl = process.env.BACKEND_URL
  if (envBackendUrl && envBackendUrl !== "/") {
    return `${envBackendUrl}/admin`
  }
  return `${window.location.origin}/admin`;
}