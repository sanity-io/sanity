export function pluralize(word: string, count: number) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
