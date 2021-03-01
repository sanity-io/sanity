export interface SanityDocument {
  [key: string]: unknown
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
}

export interface TypedObject {
  [key: string]: unknown
  _type: string
}

export interface KeyedObject {
  [key: string]: unknown
  _key: string
}
