import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

// Utility per combinare classi Tailwind in modo sicuro
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}
