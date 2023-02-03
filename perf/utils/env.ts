export function getEnv(name: string) {
  const envVar = process.env[name]
  if (!envVar) {
    throw new Error(`Missing ${name} environment variable`)
  }
  return envVar
}
