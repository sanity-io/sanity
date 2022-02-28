import config from 'config:sanity'
import loginConfig from 'config:@sanity/default-login?'

const loginMethod = ['dual', 'cookie'].includes(loginConfig?.loginMethod)
  ? loginConfig.loginMethod
  : 'dual'

export function readConfig(): {projectId: string} {
  return {projectId: config.api.projectId}
}

export function authTokenIsAllowed(): boolean {
  return loginMethod === 'dual'
}
