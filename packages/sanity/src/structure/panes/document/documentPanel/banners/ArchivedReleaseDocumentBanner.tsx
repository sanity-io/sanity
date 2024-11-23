import {Flex, Text} from '@sanity/ui'
import {useTranslation, useVersionOperations} from 'sanity'
import {structureLocaleNamespace, usePaneRouter} from 'sanity/structure'

import {Banner} from './Banner'

export function ArchivedReleaseDocumentBanner({documentId}: {documentId: string}): JSX.Element {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  const {createVersion} = useVersionOperations()
  const {params, setParams} = usePaneRouter()
  const handleGoBack = () => {
    setParams({
      ...params,
      rev: undefined,
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
          <Text size={1}>
            You are viewing a read-only document that was published in a release. It can't be
            edited.
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
