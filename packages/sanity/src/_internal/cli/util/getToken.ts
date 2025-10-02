import ConfigStore from 'configstore'

function getTokenForEnv(sanityEnv: string) {
  const config = new ConfigStore(
    sanityEnv && sanityEnv !== 'production' ? `sanity-${sanityEnv}` : `sanity`,
    {},
    {globalConfigPath: true},
  )

  const token = config.get('authToken')
  if (!token) {
    throw new Error(
      `Not authenticated${sanityEnv === 'staging' ? ' in staging' : ''}. Run ${sanityEnv === 'staging' ? 'SANITY_INTERNAL_ENV=staging ' : ''}sanity login`,
    )
  }
  return token
}

function resolveEnv(apiHost?: string) {
  return apiHost
    ? apiHost.endsWith('.work')
      ? 'staging'
      : 'production'
    : process.env.SANITY_INTERNAL_ENV || 'production'
}

export function getToken(apiHost?: string) {
  return process.env.SANITY_AUTH_TOKEN || getTokenForEnv(resolveEnv(apiHost))
}
