import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'
import { supabase } from './supabase'
import { publicTransactionsRowSchema, publicCategoriesRowSchema } from '../types/database.schemas'
import type { z } from 'zod'

export type Category = z.infer<typeof publicCategoriesRowSchema>

const transactionSchema = publicTransactionsRowSchema.extend({
  id: publicTransactionsRowSchema.shape.id.optional(),
  created_at: publicTransactionsRowSchema.shape.created_at.optional(),
})

export type Transaction = z.infer<typeof transactionSchema>

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
    schema: transactionSchema,
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })
      if (error) throw error
      return data
    },
    queryClient,
    getKey: (item) => item.public_id,
    onInsert: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const m = mutation.modified
      const { error } = await supabase.from('transactions').insert({
        public_id: m.public_id,
        date: m.date,
        amount: m.amount,
        category_id: m.category_id,
        description: m.description ?? null,
        recurrent: m.recurrent ?? false,
      })
      if (error) throw error
    },
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const patch = mutation.changes
      const { error } = await supabase.from('transactions').update(patch).eq('public_id', mutation.key as string)
      if (error) throw error
      await transactionsCollection.utils.refetch()
    },
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const { error } = await supabase.from('transactions').delete().eq('public_id', mutation.key as string)
      if (error) throw error
      await transactionsCollection.utils.refetch()
    },
  }),
)
