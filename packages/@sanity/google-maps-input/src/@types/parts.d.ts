declare module 'part:*'
declare module 'all:part:*' {
  const parts: unknown[]
  export default parts
}
declare module 'config:@sanity/google-maps-input' {
  interface Config {
    apiKey: string
    defaultZoom?: number
    defaultLocation?: {
      lat: number
      lng: number
    }
  }
  const config: Config
  export default config
}

declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/buttons/default' {
  export * from '@sanity/components/src/buttons/DefaultButton'
  export {default} from '@sanity/components/src/buttons/DefaultButton'
}

declare module 'part:@sanity/components/avatar' {
  export * from '@sanity/components/src/avatar'
}

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/components/src/tooltip'
}
