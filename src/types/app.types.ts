import type { Tables } from './database.types'

export type Category = Tables<'categories'>
export type Transaction = Tables<'transactions'>

export type DraftRow = {
  id?: number
  date: string
  amount: string
  category_id: number | ''
  type: 'income' | 'expense'
  description: string
  recurrent: boolean
  isDirty: boolean
}
