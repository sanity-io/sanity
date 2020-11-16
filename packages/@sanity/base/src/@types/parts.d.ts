/* eslint-disable import/no-duplicates */
/* eslint-disable import/export */

// @todo: define interface
declare module 'part:@sanity/base/authentication-fetcher'
declare module 'part:@sanity/components/dialogs/fullscreen-message?'

declare module 'config:sanity' {
  interface SanityConfig {
    api: {
      projectId: string
      dataset: string
    }
  }

  const config: SanityConfig
  export default config
}

declare module 'sanity:css-custom-properties' {
  const cssCustomProperties: Record<string, string>
  export default cssCustomProperties
}

declare module 'sanity:versions' {
  type PackageName = string
  type VersionNumber = string
  const versions: Record<PackageName, VersionNumber>
  export default versions
}

declare module 'part:@sanity/base/configure-client?' {
  import {SanityClient as OriginalSanityClient} from '@sanity/client'

  type Configurer = (client: OriginalSanityClient) => OriginalSanityClient
  const configure: Configurer | undefined

  export default configure
}

declare module 'part:@sanity/base/client' {
  import {SanityClient} from '@sanity/client'

  const client: SanityClient

  export default client
}

// @todo: convert to TS
declare module 'part:@sanity/base/util/draft-utils'

declare module 'part:@sanity/base/schema' {
  // @todo: define Schema interface
  type Schema = any

  const schema: Schema

  export default schema
}

declare module 'part:@sanity/base/root' {
  const RootComponent: React.ComponentType
  export default RootComponent
}

declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/loading/spinner-style'

declare module 'part:@sanity/components/avatar' {
  export * from '@sanity/components/src/avatar'
}

declare module 'part:@sanity/components/buttons/default' {
  export {default} from '@sanity/components/src/buttons/DefaultButton'
}

declare module 'part:@sanity/components/layer' {
  export * from '@sanity/components/src/layer'
}

declare module 'part:@sanity/components/loading/spinner' {
  export {default} from '@sanity/components/src/loading/Spinner'
}

declare module 'part:@sanity/components/portal' {
  export * from '@sanity/components/src/portal'
}

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/components/src/tooltip'
}

declare module 'part:@sanity/components/popover' {
  export * from '@sanity/components/src/popover'
}

declare module 'part:@sanity/components/scroll' {
  export * from '@sanity/components/src/scroll'
}

declare module 'part:@sanity/components/snackbar/provider' {
  export {default} from '@sanity/components/src/snackbar/SnackbarProvider'
}

declare module 'all:part:*'
