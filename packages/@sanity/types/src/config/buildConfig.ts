export interface BuildConfig {
  api?: {
    projectId: string
    dataset: string
  }
  project?: {
    basePath?: string
  }
  server?: {
    hostname?: string
    port?: number
  }

  // @todo
  vite?: (config: any) => any
}
