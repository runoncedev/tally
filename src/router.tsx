import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import MonthDetail from './pages/MonthDetail'
import RecurringSettings from './pages/RecurringSettings'

const rootRoute = createRootRoute({ component: Layout })
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const monthRoute = createRoute({ getParentRoute: () => rootRoute, path: '/month/$month', component: MonthDetail })
const recurringRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings/recurring', component: RecurringSettings })

export const routeTree = rootRoute.addChildren([homeRoute, monthRoute, recurringRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
