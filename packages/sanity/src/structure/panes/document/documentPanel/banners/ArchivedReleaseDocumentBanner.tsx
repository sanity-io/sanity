import {Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  Translate,
  useReleases,
  useTranslation,
  VersionInlineBadge,
} from 'sanity'
import {structureLocaleNamespace, usePaneRouter} from 'sanity/structure'

import {Banner} from './Banner'

export function ArchivedReleaseDocumentBanner(): JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)
  const {archivedReleases} = useReleases()

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
  return (
    <Banner
      tone="caution"
      paddingY={2}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
          <Text size={1}>
            <Translate
              t={t}
              i18nKey="banners.archived-release.description"
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
