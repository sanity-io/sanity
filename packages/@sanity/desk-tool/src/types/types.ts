export type StructurePane = any

export interface RouterPane {
  id: string
  params: Record<string, string>
  payload?: unknown
}

export interface StructureErrorType {
  helpId?: string
  message: string
  path?: Array<string | number>
  stack: string
}

export interface PreviewValue {
  id?: string
  subtitle?: React.ReactNode
  title?: React.ReactNode
  media?: React.ReactNode | React.ComponentType
  icon?: boolean
  type?: string
  displayOptions?: {showIcon?: boolean}
  schemaType?: {name?: string}
}

export type DeskToolPaneActionHandler = (params: any, scope?: unknown) => void
