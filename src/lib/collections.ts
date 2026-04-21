import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'
import { supabase } from './supabase'
import type { TablesInsert, TablesUpdate } from '../types/database.types'

export const queryClient = new QueryClient()

export const categoriesCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (error) throw error
      return data
    },
    queryClient,
    getKey: (item) => item.id,
  }),
)

export const transactionsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })
      if (error) throw error
      return data
    },
    queryClient,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const m = mutation.modified as TablesInsert<'transactions'>
      const { error } = await supabase.from('transactions').insert({
        date: m.date,
        amount: m.amount,
        category_id: m.category_id,
        description: m.description ?? null,
        recurrent: m.recurrent ?? false,
      })
      if (error) throw error
      await transactionsCollection.utils.refetch()
    },
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const patch = mutation.changes as TablesUpdate<'transactions'>
      const { error } = await supabase.from('transactions').update(patch).eq('id', mutation.key as number)
      if (error) throw error
      await transactionsCollection.utils.refetch()
    },
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const { error } = await supabase.from('transactions').delete().eq('id', mutation.key as number)
      if (error) throw error
      await transactionsCollection.utils.refetch()
    },
  }),
)
