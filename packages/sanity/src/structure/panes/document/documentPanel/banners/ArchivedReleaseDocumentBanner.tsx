import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  isCardinalityOneRelease,
  LATEST,
  ReleaseTitle,
  type TargetPerspective,
  Translate,
  useArchivedReleases,
  useTranslation,
  VersionInlineBadge,
} from 'sanity'

import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

function VersionBadge({
  children,
  release,
}: {
  children?: React.ReactNode
  release?: TargetPerspective
}) {
  return (
    <VersionInlineBadge $tone={getReleaseTone(release ?? LATEST)}>{children}</VersionInlineBadge>
  )
}

export function ArchivedReleaseDocumentBanner({
  releaseId,
}: {releaseId?: string} = {}): React.JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {data: archivedReleases} = useArchivedReleases()

  const {params, setParams} = usePaneRouter()
  // Use the explicit releaseId prop (for archived scheduled drafts) or
  // fall back to the historyVersion param (for archived releases)
  const effectiveReleaseId = releaseId ?? params?.historyVersion
  const handleGoBack = () => {
    setParams({
      ...params,
      rev: params?.historyEvent || undefined,
      since: undefined,
      historyVersion: undefined,
      scheduledDraft: undefined,
    })
  }

  const release = useMemo(() => {
    return archivedReleases.find(
      (r) => getReleaseIdFromReleaseDocumentId(r._id) === effectiveReleaseId,
    )
  }, [archivedReleases, effectiveReleaseId])

  const description = useMemo(() => {
    if (release?.state === 'published') {
      return 'banners.published-release.description'
    }

    if (release && isCardinalityOneRelease(release)) {
      return 'banners.archived-scheduled-draft.description'
    }

    return 'banners.archived-release.description'
  }, [release])

  return (
    <Banner
      tone="caution"
      content={
        <Text size={1}>
          <ReleaseTitle
            title={release?.metadata.title}
            fallback={tCore('release.placeholder-untitled-release')}
          >
            {({displayTitle}) => (
              <Translate
                t={t}
                i18nKey={description}
                values={{
                  title: displayTitle,
                }}
                components={{VersionBadge}}
                componentProps={{release}}
              />
            )}
          </ReleaseTitle>
        </Text>
      }
      action={
        params?.archivedRelease
          ? undefined
          : {
              text: 'Go back to published version',
              onClick: handleGoBack,
            }
      }
    />
  )
}
