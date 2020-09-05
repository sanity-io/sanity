// @todo: define interface
declare module 'part:@sanity/base/authentication-fetcher'

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
