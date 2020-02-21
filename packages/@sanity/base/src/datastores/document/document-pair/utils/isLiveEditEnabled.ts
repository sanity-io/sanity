import schema from 'part:@sanity/base/schema'

export const isLiveEditEnabled = (typeName: string): boolean =>
  schema.get(typeName).liveEdit === true
