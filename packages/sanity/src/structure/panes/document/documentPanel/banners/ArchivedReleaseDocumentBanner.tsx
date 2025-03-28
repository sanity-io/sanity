import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getVersionInlineBadge,
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

  const description =
    release?.state === 'published'
      ? 'banners.published-release.description'
      : 'banners.archived-release.description'

  const title = release?.metadata.title || tCore('release.placeholder-untitled-release')

  return (
    <Banner
      tone="caution"
      content={
        <Text size={1}>
          <Translate
            t={t}
            i18nKey={description}
            values={{
              title,
            }}
            components={{
              VersionBadge: getVersionInlineBadge(release),
            }}
          />
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
