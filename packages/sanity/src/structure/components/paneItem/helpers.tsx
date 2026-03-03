import {type SchemaType} from '@sanity/types'

export const isLiveEditEnabled = (schemaType: Pick<SchemaType, 'liveEdit'>) =>
  schemaType.liveEdit === true
