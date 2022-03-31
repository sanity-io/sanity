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
