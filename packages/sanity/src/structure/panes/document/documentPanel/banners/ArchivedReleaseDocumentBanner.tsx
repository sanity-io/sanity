import {Flex, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {structureLocaleNamespace, usePaneRouter} from 'sanity/structure'

import {Banner} from './Banner'

export function ArchivedReleaseDocumentBanner(): JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)

  const {params, setParams} = usePaneRouter()
  const handleGoBack = () => {
    setParams({
      ...params,
      rev: params?.historyEvent || undefined,
      since: undefined,
      historyVersion: undefined,
    })
  }

  return (
    <Banner
      tone="caution"
      paddingY={2}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
          <Text size={1}>{t('banners.archived-release.description')}</Text>
        </Flex>
      }
      action={{
        text: 'Go back to published version',
        onClick: handleGoBack,
      }}
    />
  )
}
