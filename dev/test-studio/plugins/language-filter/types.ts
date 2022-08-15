export interface LanguageFilterPluginOptions {
  defaultLanguages?: string[]
  supportedLanguages: {id: string; title: string}[]
  types?: string[]
}
