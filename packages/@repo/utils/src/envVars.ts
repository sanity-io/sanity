export function readEnv<KnownEnvVar extends string>(name: KnownEnvVar): string {
  const val = findEnv<KnownEnvVar>(name)
  if (val === undefined) {
    throw new Error(`Missing required environment variable "${name}"`)
  }
  return val
}

export function findEnv<KnownEnvVar extends string>(name: KnownEnvVar): string | undefined {
  return process.env[name]
}
