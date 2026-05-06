import { describe, it, expect } from 'vitest'
import { extractEmailData } from '../lib/email-extractor'

const SAMPLE_EMAIL = `FULANITO PEREZ

Se ha realizado una compra por $ 45.544 en CENTRO MEDICO CPM PUERTO MONTT CL asociado a su tarjeta de Débito terminada en **** 1234 el día 05/05/2016 a las 19:49 hrs.`

describe('extractEmailData', () => {
  it('extrae el monto', () => {
    expect(extractEmailData(SAMPLE_EMAIL).amount).toBe('45.544')
  })

  it('extrae el merchant', () => {
    expect(extractEmailData(SAMPLE_EMAIL).merchant).toBe('CENTRO MEDICO CPM PUERTO MONTT CL')
  })

  it('extrae el datetime', () => {
    expect(extractEmailData(SAMPLE_EMAIL).datetime).toBe('05/05/2016 19:49')
  })

  it('retorna null si no encuentra datos', () => {
    expect(extractEmailData('hola mundo')).toBeNull()
  })
})
