export function isTrueish(value: string | undefined) {
  if (value === undefined) return false
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false
  const number = parseInt(value, 10)
  if (isNaN(number)) return false
  return number > 0
}
