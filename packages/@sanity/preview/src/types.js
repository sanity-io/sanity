
export type Id = string
export type FieldName = string

export type Path = FieldName[]
export type Selection = [Id, FieldName[]]
export type ViewOptions = {}

export type Type = {
  type: ?Type,
  name: string
}
