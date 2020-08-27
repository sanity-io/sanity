declare module 'part:*'
declare module 'all:part:@sanity/base/diff-resolver' {
  import {ComponentType} from 'react'

  type DiffComponentResolver = (options: {schemaType: any}) => ComponentType | undefined

  const parts: DiffComponentResolver[]
  export default parts
}
