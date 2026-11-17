import {type OperationsAPI} from 'sanity'

import {type StructureLocaleResourceKeys} from '../i18n'

/** @internal */
export const PUBLISH_DISABLED_REASON = {
  LIVE_EDIT_ENABLED: 'action.publish.live-edit.publish-disabled',
  ALREADY_PUBLISHED: 'action.publish.already-published.no-time-ago.tooltip',
  NO_CHANGES: 'action.publish.no-changes.tooltip',
  NOT_READY: 'action.publish.disabled.not-ready',
  NOT_PUBLISHABLE: 'action.publish.disabled.not-publishable',
  TARGET_NOT_FOUND: 'action.publish.disabled.target-not-found',
} as const satisfies Record<
  Exclude<OperationsAPI['publish']['disabled'], false>,
  StructureLocaleResourceKeys
>

/** @internal */
export const DISCARD_CHANGES_DISABLED_REASON = {
  NO_CHANGES: 'action.discard-changes.disabled.no-change',
  NOT_PUBLISHED: 'action.discard-changes.disabled.not-published',
  NOT_READY: 'action.discard-changes.disabled.not-ready',
  TARGET_NOT_FOUND: 'action.discard-changes.disabled.target-not-found',
} as const satisfies Record<
  Exclude<OperationsAPI['discardChanges']['disabled'], false>,
  StructureLocaleResourceKeys
>
