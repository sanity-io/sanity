export function jsonToCsv(json: unknown): string {
  if (!Array.isArray(json) || json.length === 0) {
    return ''
  }

  const keys = Object.keys(json[0])
  const csv = [keys.join(',')]

  for (const row of json) {
    const values = keys.map((key) => {
      const value = row[key]
      return typeof value === 'string' ? value : JSON.stringify(value)
    })

    csv.push(values.join(','))
  }

  return csv.join('\n')
}
