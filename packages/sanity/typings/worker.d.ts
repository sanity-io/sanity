// Vite's inline worker import (https://vite.dev/guide/features#import-with-query-suffixes), which
// `sanity dev` / `sanity build` resolve from source and the package build reproduces through the
// `inlineWorker` plugin in `tsdown.config.ts`.
declare module '*?worker&inline' {
  const InlineWorker: new (options?: WorkerOptions) => Worker
  export default InlineWorker
}
