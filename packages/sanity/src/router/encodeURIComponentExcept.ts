/**
 * Like encodeURIComponent, but supports a custom set of unescaped characters.
 * @param uriComponent - A value representing an unencoded URI component.
 * @param unescaped - a string containing characters to not escape
 */
export function encodeURIComponentExcept(
  uriComponent: string | number | boolean,
  unescaped: string,
): string {
  const chars = [...String(uriComponent)]
  let res = ''
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    if (unescaped.includes(char)) {
      res += char
    } else {
      res += encodeURIComponent(char)
    }
  }
  return res
}
