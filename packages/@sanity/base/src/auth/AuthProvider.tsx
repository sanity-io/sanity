import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {SanityAuthConfig} from '../config'
import {useClient} from '../client'
import {AuthContext} from './AuthContext'
import {createAuthController} from './authController'
import {AuthState} from './types'

const INITIAL_STATE: AuthState = {
  error: null,
  loaded: false,
  providers: null,
  user: null,
}

export function AuthProvider(props: {children?: React.ReactNode; config?: SanityAuthConfig}) {
  const {children, config} = props
  const client = useClient()
  const [state, setState] = useState<AuthState>(INITIAL_STATE)
  const authController = useMemo(() => createAuthController({client, config}), [client, config])

  // Load current user
  useEffect(() => {
    const sub = authController.getCurrentUser().subscribe({
      next(user) {
        setState({
          error: null,
          loaded: true,
          providers: null,
          user,
        })
      },
      error(error) {
        setState({
          error,
          loaded: true,
          providers: null,
          user: null,
        })
      },
    })

    return () => sub.unsubscribe()
  }, [authController])

  // Load login providers
  useEffect(() => {
    if (!state.loaded) return undefined
    if (state.user) return undefined

    const sub = authController.getProviders().subscribe({
      next(providers) {
        setState((prevState) => ({
          ...prevState,
          providers,
        }))
      },
      error(err) {
        // @todo
        console.error(err)
      },
    })

    return () => sub.unsubscribe()
  }, [authController, state.loaded, state.user])

  useEffect(() => {
    if (config?.redirectOnSingle && state.providers?.length === 1) {
      const provider = state.providers[0]

      // @todo
      console.warn('@todo: redirect', provider.url)

      // const currentUrl = encodeURIComponent(window.location.toString())
      // const params = [`origin=${currentUrl}`, projectId && `projectId=${projectId}`].filter(Boolean)
      // if (provider.custom && !provider.supported && !this.state.error) {
      //   this.setState({
      //     error: {
      //       message:
      //         'This project is missing the required "thirdPartyLogin" ' +
      //         'feature to support custom logins.',
      //       link: generateHelpUrl('third-party-login'),
      //       hideClose: true,
      //     },
      //   })
      //   return
      // }
      // if (!this.state.error) {
      //   window.location = `${provider.url}?${params.join('&')}`
      // }
    }
  }, [config, state.providers])

  const logout = useCallback(() => {
    authController
      .logout()
      .then(() => {
        setState({...INITIAL_STATE, loaded: true})
      })
      .catch((err) => {
        // @todo
        console.error(err)
      })
  }, [authController])

  const contextValue = useMemo(() => ({...state, logout}), [logout, state])

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
