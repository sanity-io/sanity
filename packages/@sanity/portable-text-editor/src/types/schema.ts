export type Type = {
  type: Type
  name: string
  title: string
  description?: string
  readOnly?: boolean
  of?: Type[]
  options: Record<string, any> | null
  fields?: Type[]
  [prop: string]: any
}

export type PortableTextType = Type & {
  options?: {
    editModal?: 'modal' | 'fullscreen'
    sortable?: boolean
    layout?: 'grid'
  }
  styles?: {title: string; value: string}[]
}

export type RawType = {
  type: string
  name: string
  title?: string
  description?: string
  readOnly?: boolean
  of?: Type[] | RawType[]
  options?: Record<string, any> | null
  fields?: Type[] | RawType[]
  [prop: string]: any
}
