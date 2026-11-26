import { computed, ref } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'levelup.theme'

const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system'

const media =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
const theme = ref<Theme>(isTheme(stored) ? stored : 'system')
const systemDark = ref(media?.matches ?? false)

const resolvedTheme = computed<'light' | 'dark'>(() =>
  theme.value === 'system' ? (systemDark.value ? 'dark' : 'light') : theme.value,
)

function apply() {
  const root = document.documentElement
  const isDark = resolvedTheme.value === 'dark'
  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

export function initTheme() {
  if (!media) return
  systemDark.value = media.matches
  media.addEventListener('change', (event) => {
    systemDark.value = event.matches
    apply()
  })
  apply()
}

export function setTheme(next: Theme) {
  theme.value = next
  window.localStorage.setItem(STORAGE_KEY, next)
  apply()
}

export function useTheme() {
  return { theme, resolvedTheme, setTheme }
}
