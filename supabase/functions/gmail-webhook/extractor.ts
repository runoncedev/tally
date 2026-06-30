type ExtractedEmailData = { amount: string; merchant: string; datetime: string }

function extractBancoEstado(text: string): ExtractedEmailData | null {
  const normalized = text.replace(/\s+/g, " ")
  const amountMatch = normalized.match(/\$\s*([\d.,]+)/)
  const merchantMatch = normalized.match(/\$\s*[\d.,]+\s+en\s+(.+?)\s+asociado/)
  const datetimeMatch = normalized.match(/(\d{2}\/\d{2}\/\d{4})\s+a\s+las\s+(\d{2}:\d{2})/)
  if (!amountMatch || !merchantMatch || !datetimeMatch) return null
  return {
    amount: amountMatch[1],
    merchant: merchantMatch[1].trim(),
    datetime: `${datetimeMatch[1]} ${datetimeMatch[2]}`,
  }
}

function extractBancoChile(text: string): ExtractedEmailData | null {
  const normalized = text.replace(/\s+/g, " ")
  // "compra por $9.626 con cargo a Cuenta ****6120 en MERCADOPAGO*FAYFA el 05/06/2026 18:13"
  const amountMatch = normalized.match(/compra por \$\s*([\d.,]+)/)
  const merchantMatch = normalized.match(/en\s+([A-Z0-9*][^\s].*?)\s+el\s+\d{2}\/\d{2}\/\d{4}/)
  const datetimeMatch = normalized.match(/el\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/)
  if (!amountMatch || !merchantMatch || !datetimeMatch) return null
  return {
    amount: amountMatch[1],
    merchant: merchantMatch[1].trim(),
    datetime: `${datetimeMatch[1]} ${datetimeMatch[2]}`,
  }
}

function extractTenpo(text: string): ExtractedEmailData | null {
  const normalized = text.replace(/\s+/g, " ")
  // "Monto transacción: $78.650" ... "Comercio: Mercado Libre" ... "Fecha: 28-06-2026" ... "Hora: 20:22:11"
  const amountMatch = normalized.match(/Monto transacci[oó]n:\s*\$\s*([\d.,]+)/)
  const merchantMatch = normalized.match(/Comercio:\s*(.+?)\s*Fecha:/)
  const dateMatch = normalized.match(/Fecha:\s*(\d{2})-(\d{2})-(\d{4})/)
  const timeMatch = normalized.match(/Hora:\s*(\d{2}:\d{2})/)
  if (!amountMatch || !merchantMatch || !dateMatch || !timeMatch) return null
  return {
    amount: amountMatch[1],
    merchant: merchantMatch[1].trim(),
    datetime: `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]} ${timeMatch[1]}`,
  }
}

export const emailExtractors: Record<string, (text: string) => ExtractedEmailData | null> = {
  "notificaciones@correo.bancoestado.cl": extractBancoEstado,
  "enviodigital@bancochile.cl": extractBancoChile,
  "no-reply@tenpo.cl": extractTenpo,
}
