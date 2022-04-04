import React, {useState} from 'react'
import {ErrorBoundary} from '@sanity/ui'
import {AuthError, AuthController} from '../auth'
import {SourceOptions} from '../config'

interface AuthBoundaryProps {
  children: React.ReactNode
  loginScreen: React.ComponentType<{
    authController: AuthController
    sourceOptions: SourceOptions
  }>
}

export function AuthBoundary({children, loginScreen: LoginScreen}: AuthBoundaryProps) {
  const [{error}, setError] = useState<{error: unknown}>({error: null})

  if (error instanceof AuthError) {
    return <LoginScreen authController={error.authController} sourceOptions={error.sourceOptions} />
  }

  if (error) throw error

  return <ErrorBoundary onCatch={setError}>{children}</ErrorBoundary>
}
