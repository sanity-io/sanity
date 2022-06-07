export interface LoginProvider {
  title: string
  name: string
  id?: string
  disabled?: boolean
  type?: string
}

export interface ProvidersResponse {
  providers: LoginProvider[]
}

export interface EventWithMessage {
  message?: string
}

export interface ListenRequestError {
  type: 'request-error'
  message: string
}

export interface ListenTimeout {
  type: 'timeout'
  message: string
}

export interface ListenSecret {
  type: 'secret'
  secret: string
}

export interface ListenUrl {
  type: 'url'
  url: string
}

export interface ListenToken {
  token: string
  uuid?: string
}

export interface GenericListenError {
  type: 'error'
  message: string
  uuid?: string
}

export type ListenMessageData = ListenSecret | ListenUrl | ListenToken
export type ListenFailureMessage = ListenRequestError | ListenTimeout | GenericListenError
