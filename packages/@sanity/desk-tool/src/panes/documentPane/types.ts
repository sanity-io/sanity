export interface Doc {
  _id?: string
  _type?: string
  _rev?: string
  _updatedAt?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface MenuAction {
  action: string
  icon?: React.FunctionComponent | React.Component
  isDisabled?: boolean
  title: React.ReactNode
  url?: string
}

export interface DocumentViewType {
  type: string
  id: string
  title: string
  options: {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
}

export interface ObjectSchemaType {
  name: string
  jsonType: string
  title?: string
  fields: ObjectField[]
}

export interface ObjectField {
  name: string
  title: string
  type: SchemaType
}

export type SchemaType = ObjectSchemaType
