import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import Home from './pages/Home'
import NewTransaction from './pages/NewTransaction'

const rootRoute = createRootRoute({ component: Outlet })

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const newRoute = createRoute({ getParentRoute: () => rootRoute, path: '/new', component: NewTransaction })

const routeTree = rootRoute.addChildren([homeRoute, newRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
