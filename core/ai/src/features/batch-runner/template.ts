const VARIABLE = /\{\{\s*(item|index|total|date|\d+)\s*\}\}/g

export const parseItems = (text: string): string[] => text.split('\n').map((line) => line.trim()).filter(Boolean)

export const renderTemplate = (template: string, item: string, index: number, total: number): string => {
  const cells = item.includes('\t') ? item.split('\t') : item.split(',')
  return template.replace(VARIABLE, (_match, key: string) => {
    if (key === 'item') return item
    if (key === 'index') return String(index + 1)
    if (key === 'total') return String(total)
    if (key === 'date') return new Date().toLocaleDateString()
    return (cells[Number(key) - 1] ?? '').trim()
  })
}