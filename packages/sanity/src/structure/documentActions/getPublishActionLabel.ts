type PublishState =
  | {status: 'publishing'; publishRevision: string | undefined}
  | {status: 'published'}
  | null

/**
 * Idle, in-progress, and completed labels for the publish document action.
 * Variant documents use a distinct idle label so editors can tell they are
 * publishing the variant, not the base document.
 *
 * @internal
 */
export function getPublishActionLabel(
  t: (key: string) => string,
  {
    isVariant,
    publishScheduled,
    publishState,
  }: {
    isVariant: boolean
    publishScheduled: boolean
    publishState: PublishState
  },
) {
  if (publishState?.status === 'published') {
    return t('action.publish.published.label')
  }
  if (publishScheduled) {
    return t('action.publish.validation-in-progress.label')
  }
  if (publishState?.status === 'publishing') {
    return t('action.publish.running.label')
  }
  return t(isVariant ? 'action.publish.variant.label' : 'action.publish.draft.label')
}
