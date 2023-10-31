import {PlaywrightTestConfig} from '@playwright/test'

export type UserPlaywrightTestConfig =
  | PlaywrightTestConfig
  | ((config: PlaywrightTestConfig) => PlaywrightTestConfig)

export interface CreatePlaywrightConfigOptions {
  projectId: string
  /**
   * This is a write token that allows playwright to interact with the studio as an authenticated user
   * You can generate your own token by heading over to the tokens-section of
   * https://www.sanity.io/manage/, or by using your CLI user token (`sanity debug --secrets`)
   *
   * **NOTE: Do not commit the token in source code. Use env variables instead**
   */
  token: string
  playwrightOptions?: UserPlaywrightTestConfig
}
