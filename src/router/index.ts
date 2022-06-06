import { createRouter, RouteRecordRaw, createWebHashHistory } from 'vue-router'

const Home = () => import('../views/Home.vue')

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
