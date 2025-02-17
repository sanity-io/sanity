import {defineEvent} from '@sanity/telemetry'

interface TypeInfo {
  liveEditResolveType: 'publish' | 'discard'
}

/**
 * When a draft in a live edit document is published
 * @internal
 */
export const ResolvedLiveEdit = defineEvent<TypeInfo>({
  name: 'LiveEdit Draft Resolved',
  version: 1,
  description: 'User resolved a draft of a live edit document to continue editing',
})
