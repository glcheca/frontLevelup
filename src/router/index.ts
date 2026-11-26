import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
        },
        {
          path: 'cursos',
          name: 'courses',
          component: () => import('@/pages/CoursesPage.vue'),
        },
        {
          path: 'cursos/:id',
          name: 'course-detail',
          component: () => import('@/pages/CourseDetailPage.vue'),
        },
        {
          path: 'calendario',
          name: 'calendar',
          component: () => import('@/pages/CalendarPage.vue'),
        },
        {
          path: 'eventos',
          name: 'events',
          component: () => import('@/pages/EventsPage.vue'),
        },
        {
          path: 'tareas',
          name: 'tasks',
          component: () => import('@/pages/TasksPage.vue'),
        },
        {
          path: 'apuntes',
          name: 'notes',
          component: () => import('@/pages/PlaceholderPage.vue'),
          props: { title: 'Apuntes' },
        },
        {
          path: 'notas',
          name: 'grades',
          component: () => import('@/pages/PlaceholderPage.vue'),
          props: { title: 'Notas' },
        },
        {
          path: 'ajustes',
          name: 'settings',
          component: () => import('@/pages/PlaceholderPage.vue'),
          props: { title: 'Ajustes' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.bootstrap()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
