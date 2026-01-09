interface DocGenTemplateOptions {
  size: number
  title: string
  id: string
}

type TypedDocument = {_type: string} & Record<string, unknown>

export type DocGenTemplate = (options: DocGenTemplateOptions) => TypedDocument
