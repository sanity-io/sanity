import {type Schema} from '@sanity/types'

export const isLiveEditEnabled = (schema: Schema, typeName: string): boolean =>
  (globalThis as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_LIVE_EDIT_OVERRIDE ??
  schema.get(typeName)?.liveEdit === true
