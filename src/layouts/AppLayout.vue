<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  Keyboard,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Moon,
  NotebookPen,
  Search,
  Settings,
  Sun,
  X,
} from 'lucide-vue-next'
import { useTheme, type Theme } from '@/composables/useTheme'
import { NEW_SHORTCUT_EVENT } from '@/composables/useNewShortcut'
import { useAuthStore } from '@/stores/auth'
import Toaster from '@/components/Toaster.vue'
import NotificationsBell from '@/components/notifications/NotificationsBell.vue'
import CommandPalette from '@/components/search/CommandPalette.vue'
import ShortcutsModal from '@/components/ui/ShortcutsModal.vue'

const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)
const paletteOpen = ref(false)
const shortcutsOpen = ref(false)

function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element) return false
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable
  )
}

function onGlobalKeydown(event: KeyboardEvent) {
  const modifier = event.metaKey || event.ctrlKey
  if (modifier && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    paletteOpen.value = !paletteOpen.value
    return
  }
  if (event.key === 'Escape' && sidebarOpen.value) {
    sidebarOpen.value = false
    return
  }
  if (isTyping(event.target)) return

  if (event.key === '?') {
    event.preventDefault()
    shortcutsOpen.value = true
    return
  }

  if (
    !modifier &&
    !event.altKey &&
    event.key.toLowerCase() === 'n' &&
    !document.querySelector('[role="dialog"]')
  ) {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent(NEW_SHORTCUT_EVENT))
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))

const { theme, resolvedTheme, setTheme } = useTheme()

const themeIcon = computed(() =>
  theme.value === 'system' ? Monitor : resolvedTheme.value === 'dark' ? Moon : Sun,
)
const themeLabel = computed(() =>
  theme.value === 'system' ? 'sistema' : theme.value === 'dark' ? 'oscuro' : 'claro',
)

async function cycleTheme() {
  const next: Theme = theme.value === 'light' ? 'dark' : theme.value === 'dark' ? 'system' : 'light'
  setTheme(next)
  if (auth.isAuthenticated) {
    try {
      await auth.saveTheme(next)
    } catch {
      // La preferencia local ya está aplicada; se reintentará al cambiar de nuevo.
    }
  }
}

const navigation = [
  { name: 'Hoy', to: { name: 'dashboard' }, icon: LayoutDashboard },
  { name: 'Cursos', to: { name: 'courses' }, icon: BookOpen },
  { name: 'Calendario', to: { name: 'calendar' }, icon: CalendarDays },
  { name: 'Eventos', to: { name: 'events' }, icon: CalendarClock },
  { name: 'Tareas', to: { name: 'tasks' }, icon: CheckSquare },
  { name: 'Apuntes', to: { name: 'notes' }, icon: NotebookPen },
  { name: 'Notas', to: { name: 'grades' }, icon: GraduationCap },
  { name: 'Ajustes', to: { name: 'settings' }, icon: Settings },
]

async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-full">
    <a href="#contenido" class="skip-link">Saltar al contenido</a>

    <!-- Sidebar -->
    <aside
      id="sidebar"
      class="fixed inset-y-0 left-0 z-30 flex w-64 transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:inset-y-auto lg:top-0 lg:h-screen lg:translate-x-0 dark:border-slate-800 dark:bg-slate-900"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-16 shrink-0 items-center justify-between px-5">
        <RouterLink :to="{ name: 'dashboard' }" class="flex items-center gap-2.5">
          <div
            class="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white"
          >
            L
          </div>
          <span class="font-semibold tracking-tight">LevelUp</span>
        </RouterLink>
        <button
          class="btn-ghost size-9 p-0 lg:hidden"
          aria-label="Cerrar menú"
          @click="sidebarOpen = false"
        >
          <X class="size-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navegación principal">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          active-class="bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="size-4.5 shrink-0" />
          {{ item.name }}
        </RouterLink>
      </nav>

      <div class="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
        <button
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          @click="shortcutsOpen = true"
        >
          <Keyboard class="size-4.5" />
          Atajos de teclado
        </button>
        <button
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          @click="handleLogout"
        >
          <LogOut class="size-4.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6"
      >
        <button
          class="btn-ghost size-9 p-0 lg:hidden"
          aria-label="Abrir menú"
          aria-controls="sidebar"
          :aria-expanded="sidebarOpen"
          @click="sidebarOpen = true"
        >
          <Menu class="size-5" />
        </button>

        <button
          class="hidden w-full max-w-md items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-500 transition hover:border-brand-400 sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
          @click="paletteOpen = true"
        >
          <Search class="size-4 shrink-0" />
          <span class="flex-1 truncate">Buscar apuntes, eventos, tareas…</span>
          <kbd
            class="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] dark:border-slate-700"
          >
            Ctrl K
          </kbd>
        </button>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="btn-ghost size-9 p-0 sm:hidden"
            aria-label="Buscar"
            @click="paletteOpen = true"
          >
            <Search class="size-5" />
          </button>
          <button
            class="btn-ghost size-9 p-0"
            :aria-label="`Cambiar tema (actual: ${themeLabel})`"
            :title="`Tema: ${themeLabel}`"
            @click="cycleTheme"
          >
            <component :is="themeIcon" class="size-5" />
          </button>
          <NotificationsBell />
          <div
            class="flex items-center gap-2 rounded-full border border-slate-200 py-1 pr-3 pl-1 dark:border-slate-700"
          >
            <div
              class="grid size-7 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
            >
              {{ auth.user?.name?.charAt(0).toUpperCase() ?? '?' }}
            </div>
            <span class="hidden text-sm font-medium sm:block">{{ auth.user?.name }}</span>
          </div>
        </div>
      </header>

      <main id="contenido" tabindex="-1" class="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
        <RouterView />
      </main>
    </div>

    <Toaster />
    <CommandPalette :open="paletteOpen" @close="paletteOpen = false" />
    <ShortcutsModal :open="shortcutsOpen" @close="shortcutsOpen = false" />
  </div>
</template>
