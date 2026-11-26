import { ref } from 'vue'
import { errorMessage } from '@/api/client'

export type ToastTone = 'success' | 'error'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const toasts = ref<Toast[]>([])
let nextId = 1

function push(message: string, tone: ToastTone = 'success') {
  const id = nextId++
  toasts.value = [...toasts.value, { id, message, tone }]
  window.setTimeout(() => dismiss(id), 5000)
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message: string) => push(message, 'success'),
    error: (error: unknown, fallback = 'Algo salió mal. Inténtalo de nuevo.') =>
      push(errorMessage(error, fallback), 'error'),
  }
}
