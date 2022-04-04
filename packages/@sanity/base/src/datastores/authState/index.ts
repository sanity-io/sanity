/* eslint-disable camelcase */

import {CrossWindowMessaging, __tmp_crossWindowMessaging} from '../crossWindowMessaging'
import {AuthStateConfig, __tmp_authState_config} from './config'
import {AuthStateState, __tmp_authState_state} from './state'
import {AuthStateTokenStore, __tmp_authState_token} from './token'

export {clearToken, saveToken} from './token'

export interface AuthStore {
  broadcastAuthStateChanged: AuthStateState['broadcastAuthStateChanged']
  fetchToken: AuthStateTokenStore['fetchToken']
  authTokenIsAllowed: AuthStateConfig['authTokenIsAllowed']
  authStateChangedInThisWindow$: AuthStateState['authStateChangedInThisWindow$']
  authStateChangedInOtherWindow$: AuthStateState['authStateChangedInOtherWindow$']
}

export function createAuthStore(context: {
  crossWindowMessaging?: CrossWindowMessaging
  loginConfig?: {loginMethod: 'dual' | 'cookie'}
  projectId: string
}): AuthStore {
  const {
    projectId,
    loginConfig,
    crossWindowMessaging = __tmp_crossWindowMessaging({projectId}),
  } = context

  const config = __tmp_authState_config({loginConfig, projectId})
  const state = __tmp_authState_state({crossWindowMessaging})
  const token = __tmp_authState_token({authStateConfig: config, authStateState: state})

  return {
    broadcastAuthStateChanged: state.broadcastAuthStateChanged,
    fetchToken: token.fetchToken,
    authTokenIsAllowed: config.authTokenIsAllowed,
    authStateChangedInThisWindow$: state.authStateChangedInThisWindow$,
    authStateChangedInOtherWindow$: state.authStateChangedInOtherWindow$,
  }
}
