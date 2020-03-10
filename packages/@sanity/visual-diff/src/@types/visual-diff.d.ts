// TODO: More defined types...
declare module 'part:@sanity/visual-diff/summarizers?'
declare module 'part:@sanity/visual-diff/visualizers?'

export interface BatesonOptions {
  summarizers?: Summarizers
  ignoreFields?: string[]
}

export interface Summarizers {
  [typeToSummarize: string]: Summarizer
}

export interface Summarizer {
  resolve(a: any, b: any, path: string[]): Summary
}

export interface Summary {
  fields: string[]
  changes: Operation[]
}

export interface Operation {
  operation: string
  path?: string // TODO: Should be required, define another interface with this one?
  from?: any
  to?: any
}
