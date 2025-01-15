import {Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  Translate,
  useArchivedReleases,
  useReleases,
  useTranslation,
  VersionInlineBadge,
} from 'sanity'
import {structureLocaleNamespace, usePaneRouter} from 'sanity/structure'

import {Banner} from './Banner'

export function ArchivedReleaseDocumentBanner(): React.JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)
  const {data} = useReleases()
  const {archivedReleases} = useArchivedReleases(data)

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

  return (
    <Banner
      tone="caution"
      paddingY={2}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
          <Text size={1}>
            <Translate
              t={t}
              i18nKey={description}
              components={{
                VersionBadge: ({children}) => {
                  if (!release) return children
                  return (
                    <VersionInlineBadge $tone={getReleaseTone(release)}>
                      {release?.metadata.title}
                    </VersionInlineBadge>
                  )
                },
              }}
            />
          </Text>
        </Flex>
      }
      action={{
        text: 'Go back to published version',
        onClick: handleGoBack,
      }}
    />
  )
}
