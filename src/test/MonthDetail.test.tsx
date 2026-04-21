import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryHistory, createRouter, RouterProvider, createRootRoute, createRoute } from '@tanstack/react-router'
import { server } from './mocks/node'
import MonthDetail from '../pages/MonthDetail'
import type { TablesInsert } from '../types/database.types'

function renderMonthDetail(month: string) {
  const rootRoute = createRootRoute()
  const monthRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/month/$month',
    component: MonthDetail,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([monthRoute]),
    history: createMemoryHistory({ initialEntries: [`/month/${month}`] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('MonthDetail', () => {
  it('muestra una transaction recién insertada', async () => {
    const inserted: TablesInsert<'transactions'>[] = []

    server.use(
      http.post(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/transactions`, async ({ request }) => {
        const body = await request.json() as TablesInsert<'transactions'>
        inserted.push(body)
        return HttpResponse.json(body, { status: 201 })
      }),
      http.get(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/transactions`, () => {
        return HttpResponse.json(inserted)
      }),
    )

    const user = userEvent.setup()
    renderMonthDetail('2026-04')

    await user.click(await screen.findByRole('button', { name: /expense/i }))
    await user.type(screen.getByPlaceholderText('0'), '99')
    await user.selectOptions(screen.getByRole('combobox'), '2')
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('99')).toBeInTheDocument()
    })
  })
})
