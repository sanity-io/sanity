export const readEnv = (env: any, name: string): string => {
  const val = env[name]
  if (typeof val !== 'string') {
    throw new Error(`Missing environment variable: "${name}"`)
  }
  return val
}
