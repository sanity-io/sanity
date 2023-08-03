/**
 * Authentication options
 *
 * @public
 */
export interface AuthConfig {
  /**
   * Login method to use for the studio the studio. Can be one of:
   * - `dual` (default) - attempt to use cookies where possible, falling back to
   *   storing authentication token in `localStorage` otherwise
   * - `cookie` - explicitly disable `localStorage` method, relying only on cookies. May fail due
   *   to cookies being treated as third-party cookies in some browsers, thus the default is `dual`.
   * - `token` - explicitly disable cookies, relying only on `localStorage` method
   */
  loginMethod?: 'dual' | 'cookie' | 'token'

  /**
   * Whether to append the providers specified in `providers` with the default providers from the
   * API, or replace the default providers with the ones specified.
   *
   * @deprecated Use the function form of `providers` instead for more control
   */
  mode?: 'append' | 'replace'

  /**
   * If true, the "Choose login provider" (eg "Google, "GitHub", "E-mail/password") screen
   * will be skipped if only a single provider is configured in the `providers` array -
   * instead it will redirect unauthenticated users straight to the authenticatino URL.
   */
  redirectOnSingle?: boolean

  /**
   * Array of authentication providers to use, or a function that takes an array of default
   * authentication providers (fetched from the Sanity API) and should return a new list of
   * providers. This can be used to selectively replace, add or remove providers from the
   * list of choices.
   *
   * @remarks If a static array of providers is provided, the `mode` property is taken into account
   *   when determining what to do with it - `append` will append the providers to the default set
   *   of providers, while `replace` will replace the default providers with the ones specified.
   *
   * If not set, the default providers will be used.
   */
  providers?: AuthProvider[] | ((prev: AuthProvider[]) => AuthProvider[] | Promise<AuthProvider[]>)

  /**
   * The API hostname for requests. Should usually be left undefined,
   * but can be set if using custom cname for API domain.
   */
  apiHost?: string
}

/**
 * A provider of authentication.
 *
 * By default, a list of providers for a project will be fetched from the
 * {@link https://api.sanity.io/v1/auth/providers | Sanity API}, but you may choose to limit this
 * list by explicitly defining the providers you want to allow, or add additional custom providers
 * that conforms to the authentication provider specification outlined in
 * {@link https://www.sanity.io/docs/third-party-login | the documentation}.
 *
 * @public
 */
export interface AuthProvider {
  /**
   * URL-friendly identifier/name for the provider, eg `github`
   */
  name: string

  /**
   * Human friendly title for the provider, eg `GitHub`
   */
  title: string

  /**
   * URL for the authentication endpoint that will trigger the authentication flow
   */
  url: string

  /**
   * URL for a logo to display next to the provider in the login screen
   */
  logo?: string
}
