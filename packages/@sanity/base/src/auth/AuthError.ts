import {SourceOptions} from '../config'
import {AuthController} from './authController'

interface AuthErrorOptions {
  message: string
  authController: AuthController
  sourceOptions: SourceOptions
}

export class AuthError extends Error {
  authController: AuthController
  sourceOptions: SourceOptions

  constructor({message, authController, sourceOptions}: AuthErrorOptions) {
    super(`AuthError: ${message}`)
    this.authController = authController
    this.sourceOptions = sourceOptions
  }
}
