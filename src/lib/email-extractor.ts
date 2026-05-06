type ExtractedEmailData = {
  amount: string
  merchant: string
  datetime: string
}

export function extractEmailData(text: string): ExtractedEmailData | null {
  const amountMatch = text.match(/\$\s*([\d.,]+)/)
  const merchantMatch = text.match(/\$\s*[\d.,]+\s+en\s+(.+?)\s+asociado/)
  const datetimeMatch = text.match(/(\d{2}\/\d{2}\/\d{4})\s+a\s+las\s+(\d{2}:\d{2})/)

  if (!amountMatch || !merchantMatch || !datetimeMatch) return null

  return {
    amount: amountMatch[1],
    merchant: merchantMatch[1],
    datetime: `${datetimeMatch[1]} ${datetimeMatch[2]}`,
  }
}
