import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/scan'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/scan'
      },
      {
        path: 'scan',
        component: () => import('@/views/Scan.vue')
      },
      {
        path: 'search',
        component: () => import('@/views/SearchTab.vue')
      },
      {
        path: 'settings',
        component: () => import('@/views/Settings.vue')
      }
    ]
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/History.vue')
  },
  {
    path: '/product/:id',
    name: 'ProductPage',
    component: () => import('@/views/ProductPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
