declare module '@sanity/import' {
  interface ImportWarning {
    type: string
    url?: string
    documents?: {
      documentId: string
      path: string
    }[]
  }

  const sanityImport: (
    stream: any,
    options: any
  ) => Promise<{numDocs: number; warnings: ImportWarning[]}>
  export = sanityImport
}
