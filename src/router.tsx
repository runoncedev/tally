import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import MonthDetail from './pages/MonthDetail'
import Settings from './pages/Settings'
import RecurringSettings from './pages/RecurringSettings'
import CategoriesSettings from './pages/CategoriesSettings'

const rootRoute = createRootRoute({ component: Layout })
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const monthRoute = createRoute({ getParentRoute: () => rootRoute, path: '/month/$month', component: MonthDetail })
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: Settings })
const recurringRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings/recurring', component: RecurringSettings })
const categoriesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings/categories', component: CategoriesSettings })

export const routeTree = rootRoute.addChildren([homeRoute, monthRoute, settingsRoute, recurringRoute, categoriesRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
