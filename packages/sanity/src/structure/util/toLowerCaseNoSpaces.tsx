/**
 * Remove the spaces and lower case the string
 *
 * @param str - string to remove the spaces and lower case
 * @returns str with no spaces and lower case
 */
export function toLowerCaseNoSpaces(str: string | undefined): string {
  if (!str) return ''
  return str.toLocaleLowerCase().replaceAll(' ', '')
}
