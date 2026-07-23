/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SANITY_STUDIO_URL?: string
  readonly DEV: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
