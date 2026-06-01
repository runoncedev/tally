import { describe, it, expect } from 'vitest'
import { emailExtractors } from '../../supabase/functions/gmail-webhook/extractor'

const FROM = "notificaciones@correo.bancoestado.cl"

const REAL_EMAIL = `CAMILO ERNESTO
RIVERA

Se ha realizado una compra por $
26.171
 en
PIZZERIA GARIBALDI       PUERTO VARAS CL
asociado a su tarjeta de Debito terminada en **** 9361
 el día
31/05/2026
 a las
13:00
hrs.`

describe('extractBancoEstado', () => {
  const extract = emailExtractors[FROM]

  it('extrae el monto', () => {
    expect(extract(REAL_EMAIL)!.amount).toBe('26.171')
  })

  it('extrae el merchant', () => {
    expect(extract(REAL_EMAIL)!.merchant).toBe('PIZZERIA GARIBALDI PUERTO VARAS CL')
  })

  it('extrae el datetime', () => {
    expect(extract(REAL_EMAIL)!.datetime).toBe('31/05/2026 13:00')
  })

  it('retorna null si no encuentra datos', () => {
    expect(extract('hola mundo')).toBeNull()
  })
})
