/* eslint-disable import/no-duplicates */
// @todo: define interface
declare module 'part:@sanity/base/authentication-fetcher'

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

declare module 'part:@sanity/components/avatar' {
  export * from '@sanity/components/src/avatar'
}

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/components/src/tooltip'
}

declare module 'all:part:*'
