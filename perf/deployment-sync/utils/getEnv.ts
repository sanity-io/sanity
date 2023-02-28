export function getEnv(varName: string): string {
  if (!(varName in process.env)) {
    throw new Error(`Missing environment variable "${varName}"`)
  }
  return process.env[varName]!
}
