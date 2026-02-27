export function readEnvVar(name: string): string {
  const val = process.env[name]
  if (val === undefined) {
    throw new Error(`Missing required environment variable "${name}"`)
  }
  return val
}
