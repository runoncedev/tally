import { http, HttpResponse } from 'msw'
import type { TablesInsert } from '../../types/database.types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

export const handlers = [
  http.get(`${SUPABASE_URL}/rest/v1/transactions`, () => {
    return HttpResponse.json([])
  }),

  http.get(`${SUPABASE_URL}/rest/v1/categories`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Salary', type: 'income' },
      { id: 2, name: 'Food', type: 'expense' },
    ])
  }),

  http.post(`${SUPABASE_URL}/rest/v1/transactions`, async ({ request }) => {
    const body = await request.json() as TablesInsert<'transactions'>
    return HttpResponse.json({ ...body, id: 1 }, { status: 201 })
  }),
]
