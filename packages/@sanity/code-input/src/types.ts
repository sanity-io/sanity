export interface CodeInputLanguage {
  title: string
  value: string
}

export interface CodeInputType {
  name?: string
  title?: string
  description?: string
  fields: {name: string; title?: string; placeholder?: string}[]
}

export interface CodeInputValue {
  _type?: 'code'
  code?: string
  filename?: string
  language?: string
  highlightedLines?: number[]
}
