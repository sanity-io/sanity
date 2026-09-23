import {type ReleaseDocument} from '@sanity/client'
import {Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useEffect} from 'react'
import {useEffectEvent} from 'use-effect-event'

import {useTranslation} from '../i18n/hooks/useTranslation'
import {Translate} from '../i18n/Translate'
import {useArchivedReleases} from '../releases/store/useArchivedReleases'
import {getReleaseIdFromReleaseDocumentId} from '../releases/util/getReleaseIdFromReleaseDocumentId'
import {isCardinalityOneRelease} from '../util/releaseUtils'
import {usePerspective} from './usePerspective'
import {useSetPerspective} from './useSetPerspective'

function getToastTitleAndDescription(archived: ReleaseDocument): {
  title: string
  description?: string
} {
  if (archived.state === 'published') {
    if (isCardinalityOneRelease(archived)) {
      return {
        title: 'release.toast.scheduled-draft-published.title',
      }
    }
    return {
      title: 'release.toast.published-release.title',
      description: 'release.toast.published-release.description',
    }
  }

  return {
    title: 'release.toast.archived-release.title',
    description: 'release.toast.archived-release.description',
  }
}

/**
 * Clears a sticky release perspective once that release is archived or published.
 *
 * Mounted only from `GlobalPerspectiveProvider`. Do not put this in `PerspectiveProvider` —
 * nested panes (e.g. DiffView) reuse it with a local selected name, and navigating from there
 * would clear the global sticky param.
 *
 * @internal
 */
export function ResetArchivedReleasePerspective() {
  const toast = useToast()
  const {t} = useTranslation()
  const {data: archivedReleases, loading} = useArchivedReleases()
  const {selectedPerspectiveName} = usePerspective()
  const setPerspective = useSetPerspective()

  const resetIfArchived = useEffectEvent(
    (isLoading: boolean, perspectiveName: string | undefined, releases: ReleaseDocument[]) => {
      if (isLoading) return
      if (!perspectiveName || perspectiveName === 'published' || perspectiveName === 'drafts') {
        return
      }

      const archived = releases.find(
        (release) => getReleaseIdFromReleaseDocumentId(release._id) === perspectiveName,
      )
      if (!archived) return

      setPerspective(undefined)

      const {title, description} = getToastTitleAndDescription(archived)

      toast.push({
        id: `bundle-deleted-toast-${perspectiveName}`,
        status: 'warning',
        title: (
          <Text muted size={1}>
            <Translate
              t={t}
              i18nKey={title}
              values={{title: archived.metadata?.title || perspectiveName}}
            />
          </Text>
        ),
        description: description && (
          <Text muted size={1}>
            <Translate t={t} i18nKey={description} />
          </Text>
        ),
        duration: 10000,
      })
    },
  )

  useEffect(() => {
    resetIfArchived(loading, selectedPerspectiveName, archivedReleases)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [archivedReleases, loading, selectedPerspectiveName])

  return null
}
