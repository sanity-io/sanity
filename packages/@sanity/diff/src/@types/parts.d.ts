declare module 'part:*'
declare module 'all:part:*'
declare module 'part:@sanity/base/schema?' {
  interface SchemaType {
    name: string
    title?: string
    jsonType: string
    type?: SchemaType
  }

  interface Schema {
    get: (typeName: string) => SchemaType | undefined
  }

  const schema: Schema
  export default schema
}
