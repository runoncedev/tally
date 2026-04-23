import { supabase } from './supabase'
import type { Transaction } from './collections'
import type { TablesInsert, TablesUpdate } from '../types/database.types'

export async function fetchAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchMonthTransactions(month: string): Promise<Transaction[]> {
  const [year, mon] = month.split('-').map(Number)
  const start = `${year}-${String(mon).padStart(2, '0')}-01`
  const nextMonth = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, '0')}-01`
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', start)
    .lt('date', nextMonth)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data
}

export async function fetchRecurringTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('recurrent', true)
    .order('date', { ascending: false })
  if (error) throw error
  const seen = new Set<number>()
  return data.filter(tx => {
    if (tx.category_id == null) return false
    if (seen.has(tx.category_id)) return false
    seen.add(tx.category_id)
    return true
  })
}

export async function insertTransaction(row: TablesInsert<'transactions'>): Promise<Transaction> {
  const { data, error } = await supabase.from('transactions').insert(row).select().single()
  if (error) throw error
  return data
}

export async function updateTransaction(id: number, patch: TablesUpdate<'transactions'>): Promise<Transaction> {
  const { data, error } = await supabase.from('transactions').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id: number): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}
