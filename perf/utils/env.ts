export function getEnv(name: string, optional: true): string | undefined
export function getEnv(name: string): string
export function getEnv(name: string, optional?: boolean) {
  const envVar = process.env[name]
  if (!optional && !envVar) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return envVar
}
