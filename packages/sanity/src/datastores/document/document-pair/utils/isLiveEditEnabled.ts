import {Schema} from '@sanity/types'

export const isLiveEditEnabled = (schema: Schema, typeName: string): boolean =>
  schema.get(typeName)?.liveEdit === true
