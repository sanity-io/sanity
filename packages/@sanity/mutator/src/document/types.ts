export interface Doc {
  _id: string
  _type: string
  _rev?: string
  _updatedAt?: string
  [attribute: string]: any
}
export interface Mut {
  create?: any
  createIfNotExists?: any
  createOrReplace?: any
  delete?: any
  patch?: any
}
