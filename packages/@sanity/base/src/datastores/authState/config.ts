/* eslint-disable camelcase */

export interface AuthStateConfig {
  readConfig: () => {projectId: string}
  authTokenIsAllowed: () => boolean
}

export function __tmp_authState_config(context: {
  loginConfig?: {loginMethod: 'dual' | 'cookie'}
  projectId: string
}) {
  const {loginConfig, projectId} = context

  const loginMethod = ['dual', 'cookie'].includes(loginConfig?.loginMethod || '')
    ? loginConfig?.loginMethod
    : 'dual'

  // export
  function readConfig(): {projectId: string} {
    return {projectId}
  }

  // export
  function authTokenIsAllowed(): boolean {
    return loginMethod === 'dual'
  }

  return {readConfig, authTokenIsAllowed}
}
