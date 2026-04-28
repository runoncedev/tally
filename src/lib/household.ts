import { createContext, useContext } from 'react'
import { supabase } from './supabase'

export type Household = { id: string; name: string }

export const HouseholdContext = createContext<Household | null>(null)

export function useHousehold(): Household {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold must be used inside HouseholdProvider')
  return ctx
}

export async function fetchHousehold(): Promise<Household | null> {
  const { data, error } = await supabase
    .from('households')
    .select('id, name')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

const DEFAULT_CATEGORIES: { name: string; type: 'income' | 'expense' }[] = [
  { name: 'Salary', type: 'income' },
  { name: 'Rent', type: 'expense' },
  { name: 'Groceries', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Health', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Other', type: 'expense' },
]

export async function createHousehold(name: string): Promise<Household> {
  const { error } = await supabase.rpc('create_household', { household_name: name })
  if (error) throw error
  const household = await fetchHousehold()
  if (!household) throw new Error('Failed to fetch household after creation')
  await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map((c) => ({ ...c, household_id: household.id }))
  )
  return household
}

export async function joinHousehold(householdId: string): Promise<void> {
  const { error } = await supabase.rpc('join_household', { target_household_id: householdId })
  if (error) throw error
}
