import { onBeforeUnmount, onMounted } from 'vue'

export const NEW_SHORTCUT_EVENT = 'levelup:new'

/**
 * Ejecuta `handler` cuando el usuario pulsa `N` fuera de un campo de texto y sin modales
 * abiertos. El atajo lo despacha `AppLayout`; cada vista decide qué crear.
 */
export function useNewShortcut(handler: () => void) {
  const listener = () => handler()

  onMounted(() => window.addEventListener(NEW_SHORTCUT_EVENT, listener))
  onBeforeUnmount(() => window.removeEventListener(NEW_SHORTCUT_EVENT, listener))
}
