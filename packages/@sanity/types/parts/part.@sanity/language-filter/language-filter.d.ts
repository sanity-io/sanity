declare module 'all:part:@sanity/desk-tool/language-select-component' {
  const implementations:
    | React.FC<{
        schemaType?: import('@sanity/types').SchemaType
      }>[]
    | undefined
  export default implementations
}

declare module 'part:@sanity/language-filter/config' {
  interface Config {
    supportedLanguages: {
      id: string
      title: string
    }[]
    defaultLanguages?: string[]
    documentTypes?: string[]
    filterField?: (enclosingType, field, selectedLanguageIds) => boolean
  }
  const config: Config
  export default config
}
