export function readEnv(name: string): string {
  const val = findEnv<string>(name)
  if (val === undefined) {
    throw new Error(`Missing required environment variable "${name}"`)
  }
  return val
}

function findEnv(name: string): string | undefined {
  return process.env[name]
}
