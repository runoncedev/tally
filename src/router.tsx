import {
  createRouter,
  createRoute,
  createRootRoute,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import MonthDetail from "./pages/MonthDetail";
import CategoriesSettings from "./pages/RecurringSettings";
import LoginLocal from "./pages/LoginLocal";

function formatMonthTitle(month: string) {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

const rootRoute = createRootRoute({ component: Layout });
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
  head: () => ({ meta: [{ title: "Tally" }] }),
});
const monthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/month/$month",
  component: MonthDetail,
  head: ({ params }) => ({
    meta: [{ title: `${formatMonthTitle(params.month)} — Tally` }],
  }),
});
const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/categories",
  component: CategoriesSettings,
  head: () => ({ meta: [{ title: "Categories — Tally" }] }),
});
const loginLocalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginLocal,
  head: () => ({ meta: [{ title: "Sign in — Tally" }] }),
});

export const routeTree = rootRoute.addChildren([
  homeRoute,
  monthRoute,
  categoriesRoute,
  loginLocalRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
