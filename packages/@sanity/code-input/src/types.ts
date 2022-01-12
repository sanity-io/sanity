export interface CodeInputLanguage {
  title: string
  value: string
  mode?: string
}

export interface CodeInputType {
  name?: string
  title?: string
  description?: string
  fields: {name: string; title?: string; placeholder?: string}[]
  options?: {
    theme?: string
    languageAlternatives: CodeInputLanguage[]
    language: string
    withFilename?: boolean
  }
}

export interface CodeInputValue {
  _type?: 'code'
  code?: string
  filename?: string
  language?: string
  highlightedLines?: number[]
}
