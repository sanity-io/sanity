/*
 * resultSuffix takes a variable name and appends "result" in the same casing style.
 * Supported: camelCase, PascalCase, snake_case, UPPER_SNAKE.
 * Falls back to camelCase-style suffix when casing is unknown.
 */
export function resultSuffix(variableName: string): string {
  if (!variableName) return 'result'

  const isUpperSnake = /^[A-Z0-9_]+$/.test(variableName) // VALUE, USER_NAME
  const isSnake = /^[a-z0-9_]+$/.test(variableName) && variableName.includes('_') // user_name
  const isCamel = /^[a-z][A-Za-z0-9]*$/.test(variableName) // userName

  if (isCamel) {
    return `${variableName}Result`
  }

  if (isUpperSnake) {
    return `${variableName}_RESULT`
  }

  if (isSnake) {
    return `${variableName}_result`
  }

  // Fallback: clean weird chars and use camel-style suffix
  const cleaned = variableName.replace(/[^A-Za-z0-9]/g, '')

  return `${cleaned}Result`
}
