export type Id = string

export type Reference = {_ref: string}
export type Document = {_id: string}

export type Value = Document | Reference | any

export type FieldName = string

export type Path = FieldName[]
export type Selection = [Id, FieldName[]]
export type ViewOptions = {}

export type Type = {
  type: ?Type,
  name: string
}
