import {useToast} from '@sanity/ui/toast'
import {useEffect} from 'react'
import {Text} from 'ui5'
import {useEffectEvent} from 'use-effect-event'

import {useTranslation} from '../i18n/hooks/useTranslation'
import {type IgnoredPerspectiveReason} from './resolveStickyPerspectiveName'
import {useSetPerspective} from './useSetPerspective'

const TOAST_TITLE_KEYS: Record<IgnoredPerspectiveReason, string | undefined> = {
  // The studio never writes `?perspective=drafts`; nothing to explain.
  'drafts': undefined,
  'unknown-release': 'release.toast.unknown-perspective.title',
  'releases-off': 'release.toast.releases-off-perspective.title',
}

/**
 * Clears a `?perspective=` value the studio could not use (see `resolveStickyPerspectiveName`), so
 * the address shows the perspective in view, and says why when the link named a release.
 *
 * Mounted only from `GlobalPerspectiveProvider`, like `ResetArchivedReleasePerspective`.
 *
 * @internal
 */
export function ResetIgnoredPerspective({
  perspective,
  ignored,
}: {
  perspective: string | undefined
  ignored: IgnoredPerspectiveReason | undefined
}) {
  const toast = useToast()
  const {t} = useTranslation()
  const setPerspective = useSetPerspective()

  const reset = useEffectEvent(
    (reason: IgnoredPerspectiveReason | undefined, name: string | undefined) => {
      if (!reason || !name) return
      setPerspective(undefined)
      const titleKey = TOAST_TITLE_KEYS[reason]
      if (!titleKey) return
      toast.push({
        id: `ignored-perspective-toast-${name}`,
        status: 'warning',
        title: (
          <Text muted size={1} as="div">
            {t(titleKey, {name})}
          </Text>
        ),
        duration: 10000,
      })
    },
  )

  useEffect(() => {
    reset(ignored, perspective)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [ignored, perspective])

  return null
}
