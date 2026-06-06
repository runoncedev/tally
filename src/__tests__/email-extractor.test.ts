import { describe, it, expect } from 'vitest'
import { emailExtractors } from '../../supabase/functions/gmail-webhook/extractor'

const FROM = "notificaciones@correo.bancoestado.cl"
const FROM_BCH = "enviodigital@bancochile.cl"

const REAL_EMAIL = `JOHN
DOE

Se ha realizado una compra por $
26.171
 en
COMERCIO EJEMPLO CL
asociado a su tarjeta de Debito terminada en **** 0000
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
    expect(extract(REAL_EMAIL)!.merchant).toBe('COMERCIO EJEMPLO CL')
  })

  it('extrae el datetime', () => {
    expect(extract(REAL_EMAIL)!.datetime).toBe('31/05/2026 13:00')
  })

  it('retorna null si no encuentra datos', () => {
    expect(extract('hola mundo')).toBeNull()
  })
})

describe('extractBancoChile', () => {
  const extract = emailExtractors[FROM_BCH]

  const REAL_EMAIL = `John Doe .: Te informamos que se ha realizado una compra por $1.234 con cargo a Cuenta ****0000 en COMERCIO*EJEMPLO el 01/01/2025 10:00. Revisa Saldos y Movimientos en App Mi Banco o Banco en Línea.`

  it('extrae el monto', () => {
    expect(extract(REAL_EMAIL)!.amount).toBe('1.234')
  })

  it('extrae el merchant', () => {
    expect(extract(REAL_EMAIL)!.merchant).toBe('COMERCIO*EJEMPLO')
  })

  it('extrae el datetime', () => {
    expect(extract(REAL_EMAIL)!.datetime).toBe('01/01/2025 10:00')
  })

  it('retorna null si no encuentra datos', () => {
    expect(extract('hola mundo')).toBeNull()
  })
})
