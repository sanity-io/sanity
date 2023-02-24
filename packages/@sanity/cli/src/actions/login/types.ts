export interface LoginProvider {
  name: string
  title: string
  url: string
}

export interface SamlLoginProvider {
  id: string
  name: string
  type: 'saml'
  disabled: boolean
  organizationId: string
  loginUrl: string
  callbackUrl: string
}

export interface ProvidersResponse {
  providers: LoginProvider[]
}
