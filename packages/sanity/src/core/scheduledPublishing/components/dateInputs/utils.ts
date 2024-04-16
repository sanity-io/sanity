export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.valueOf())
}
