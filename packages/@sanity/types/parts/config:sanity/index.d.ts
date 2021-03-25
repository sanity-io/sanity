declare module 'config:sanity' {
  interface SanityConfig {
    root: boolean
    project: {
      name?: string
      basePath?: string
    }
    api: {
      projectId: string
      dataset: string
    }
    plugins: string[]
  }

  const config: SanityConfig
  export default config
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
