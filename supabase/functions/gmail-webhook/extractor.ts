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

export const emailExtractors: Record<string, (text: string) => ExtractedEmailData | null> = {
  "notificaciones@correo.bancoestado.cl": extractBancoEstado,
}
