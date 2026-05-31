import { QueryClient } from '@tanstack/query-core'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { createCollection } from '@tanstack/react-db'
import type { z } from 'zod'
import { publicCategoriesRowSchema, publicEmailTransactionsRowSchema, publicMerchantCategoryMappingsRowSchema, publicTransactionsRowSchema } from '../types/database.schemas'
import { supabase } from './supabase'

export type Category = z.infer<typeof publicCategoriesRowSchema>
export type EmailTransaction = z.infer<typeof publicEmailTransactionsRowSchema>
export type MerchantCategoryMapping = z.infer<typeof publicMerchantCategoryMappingsRowSchema>

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
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const patch = mutation.changes
      const { error } = await supabase.from('categories').update(patch).eq('id', mutation.key as number)
      if (error) throw error
      await categoriesCollection.utils.refetch()
    },
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const { error } = await supabase.from('categories').delete().eq('id', mutation.key as number)
      if (error) throw error
      await categoriesCollection.utils.refetch()
    },
  }),
)

export const emailTransactionsCollection = createCollection(
  queryCollectionOptions({
    schema: publicEmailTransactionsRowSchema,
    queryKey: ['email_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_transactions')
        .select('*')
        .is('deleted_at', null)
        .order('transacted_at', { ascending: false })
      if (error) throw error
      return data
    },
    queryClient,
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const patch = mutation.changes
      const { error } = await supabase.from('email_transactions').update(patch).eq('id', mutation.key as string)
      if (error) throw error
      await emailTransactionsCollection.utils.refetch()
    },
  }),
)

export const merchantMappingsCollection = createCollection(
  queryCollectionOptions({
    schema: publicMerchantCategoryMappingsRowSchema,
    queryKey: ['merchant_category_mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('merchant_category_mappings')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    queryClient,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const rows = transaction.mutations.map(mutation => {
        const m = mutation.modified
        return {
          merchant: m.merchant,
          category_id: m.category_id,
          household_id: m.household_id,
          created_at: m.created_at ?? new Date().toISOString(),
        }
      })
      const { error } = await supabase.from('merchant_category_mappings').insert(rows)
      if (error) throw error
    },
    onUpdate: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const patch = mutation.changes
      const { error } = await supabase.from('merchant_category_mappings').update(patch).eq('id', mutation.key as number)
      if (error) throw error
      await merchantMappingsCollection.utils.refetch()
    },
    onDelete: async ({ transaction }) => {
      const mutation = transaction.mutations[0]
      const { error } = await supabase.from('merchant_category_mappings').delete().eq('id', mutation.key as number)
      if (error) throw error
      await merchantMappingsCollection.utils.refetch()
    },
  }),
)

export const transactionsCollection = createCollection(
  queryCollectionOptions({
    schema: transactionSchema,
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    queryClient,
    getKey: (item) => item.public_id,
    onInsert: async ({ transaction }) => {
      const rows = transaction.mutations.map(mutation => {
        const m = mutation.modified
        return {
          public_id: m.public_id,
          date: m.date,
          amount: m.amount,
          category_id: m.category_id,
          description: m.description ?? null,
          created_at: m.created_at ?? new Date().toISOString(),
          household_id: m.household_id,
        }
      })
      const { error } = await supabase.from('transactions').insert(rows)
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
