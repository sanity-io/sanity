// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import schema from 'part:@sanity/base/schema'

export const isLiveEditEnabled = (typeName: string): boolean =>
  schema.get(typeName)?.liveEdit === true
