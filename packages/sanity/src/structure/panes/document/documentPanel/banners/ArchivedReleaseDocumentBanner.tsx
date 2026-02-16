import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getVersionInlineBadge,
  isCardinalityOneRelease,
  ReleaseTitle,
  Translate,
  useArchivedReleases,
  useTranslation,
} from 'sanity'

import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

export function ArchivedReleaseDocumentBanner(): React.JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  const {data: archivedReleases} = useArchivedReleases()

  const {params, setParams} = usePaneRouter()
  const handleGoBack = () => {
    setParams({
      ...params,
      rev: params?.historyEvent || undefined,
      since: undefined,
      historyVersion: undefined,
    })
  }

  const release = useMemo(() => {
    return archivedReleases.find(
      (r) => getReleaseIdFromReleaseDocumentId(r._id) === params?.historyVersion,
    )
  }, [archivedReleases, params?.historyVersion])

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
                components={{
                  VersionBadge: ({children}) => {
                    const BadgeWithTone = getVersionInlineBadge(release)
                    return <BadgeWithTone>{children}</BadgeWithTone>
                  },
                }}
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
