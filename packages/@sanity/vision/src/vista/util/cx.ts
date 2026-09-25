/** Joins class names, skipping falsy entries */
export function cx(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(' ')
}
