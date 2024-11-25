import {Flex, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {structureLocaleNamespace, usePaneRouter} from 'sanity/structure'

import {Banner} from './Banner'

export function ArchivedReleaseDocumentBanner(): JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  const {params, setParams} = usePaneRouter()
  const handleGoBack = () => {
    setParams({
      ...params,
      rev: params?.historyEvent || undefined,
      since: undefined,
      historyVersion: undefined,
    })
  }

  // TODO: i18n this
  const text =
    "You are viewing a read-only document that was published in a release. It can't be edited"

  return (
    <Banner
      tone="caution"
      paddingY={2}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
          <Text size={1}>{text}</Text>
        </Flex>
      }
      action={{
        text: 'Go back to published version',
        onClick: handleGoBack,
      }}
    />
  )
}
