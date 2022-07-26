export function validateApiVersion(apiVersion: string): boolean {
  const parseableApiVersion = apiVersion.replace(/^v/, '').trim().toUpperCase()

  const isValidApiVersion =
    parseableApiVersion.length > 0 &&
    (parseableApiVersion === 'X' ||
      (/^\d{4}-\d{2}-\d{2}$/.test(parseableApiVersion) && !isNaN(Date.parse(parseableApiVersion))))

  return isValidApiVersion
}
