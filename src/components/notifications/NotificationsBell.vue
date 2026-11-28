<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'
import { Bell, CheckCheck } from 'lucide-vue-next'
import { invalidateNotifications, keys } from '@/api/keys'
import { notificationsApi } from '@/api/notifications'
import { useToast } from '@/composables/useToast'
import type { AppNotification } from '@/types/models'
import { formatDayShort, formatTime } from '@/utils/dates'

const router = useRouter()
const queryClient = useQueryClient()
const toast = useToast()

const open = ref(false)

const countQuery = useQuery({
  queryKey: keys.notificationCount(),
  queryFn: () => notificationsApi.unreadCount(),
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
})

const listQuery = useQuery({
  queryKey: keys.notifications({ panel: true }),
  queryFn: () => notificationsApi.list({ size: 20 }),
  enabled: computed(() => open.value),
})

const unread = computed(() => countQuery.data.value ?? 0)
const notifications = computed(() => listQuery.data.value?.content ?? [])

watch(open, (value) => {
  if (value) {
    void listQuery.refetch()
  }
})

const readMutation = useMutation({
  mutationFn: (id: string) => notificationsApi.markRead(id),
  onSuccess: () => invalidateNotifications(queryClient),
  onError: (error) => toast.error(error, 'No se pudo marcar como leída.'),
})

const readAllMutation = useMutation({
  mutationFn: () => notificationsApi.markAllRead(),
  onSuccess: async () => {
    await invalidateNotifications(queryClient)
    toast.success('Notificaciones marcadas como leídas.')
  },
  onError: (error) => toast.error(error, 'No se pudieron marcar las notificaciones.'),
})

async function openNotification(notification: AppNotification) {
  if (!notification.read) {
    readMutation.mutate(notification.id)
  }
  open.value = false
  if (notification.targetType === 'event') {
    await router.push({ name: 'calendar' })
  } else if (notification.targetType === 'task') {
    await router.push({ name: 'tasks' })
  }
}
</script>

<template>
  <div class="relative">
    <button
      class="btn-ghost relative size-9 p-0"
      aria-label="Notificaciones"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Bell class="size-5" />
      <span
        v-if="unread > 0"
        class="absolute -top-0.5 -right-0.5 grid min-w-4.5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] leading-4 font-semibold text-white"
      >
        {{ unread > 9 ? '9+' : unread }}
      </span>
    </button>

    <template v-if="open">
      <div class="fixed inset-0 z-30" @click="open = false" />
      <div
        class="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <p class="text-sm font-semibold">Notificaciones</p>
          <button
            class="btn-ghost gap-1 px-2 py-1 text-xs"
            :disabled="unread === 0 || readAllMutation.isPending.value"
            @click="readAllMutation.mutate()"
          >
            <CheckCheck class="size-3.5" />
            Marcar todas
          </button>
        </div>

        <div v-if="listQuery.isLoading.value" class="space-y-2 p-4">
          <div class="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div class="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        <p v-else-if="listQuery.isError.value" class="p-4 text-sm text-rose-600">
          No se pudieron cargar las notificaciones.
        </p>

        <p v-else-if="!notifications.length" class="p-4 text-sm text-slate-500 dark:text-slate-400">
          Todo al día: no tienes notificaciones.
        </p>

        <ul v-else class="max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
          <li v-for="notification in notifications" :key="notification.id">
            <button
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
              @click="openNotification(notification)"
            >
              <span
                class="mt-1.5 size-2 shrink-0 rounded-full"
                :class="notification.read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-brand-500'"
              />
              <span class="min-w-0 flex-1">
                <span
                  class="block truncate text-sm"
                  :class="notification.read ? 'text-slate-600 dark:text-slate-300' : 'font-medium'"
                >
                  {{ notification.title }}
                </span>
                <span v-if="notification.body" class="mt-0.5 block truncate text-xs text-slate-500">
                  {{ notification.body }}
                </span>
                <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {{ formatDayShort(notification.createdAt) }} ·
                  {{ formatTime(notification.createdAt) }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
