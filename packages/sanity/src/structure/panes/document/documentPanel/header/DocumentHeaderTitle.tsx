import {Flex, Text} from '@sanity/ui'
import {memo, type ReactElement} from 'react'
import {unstable_useValuePreview as useValuePreview, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentPerspectiveMenu} from './perspective/DocumentPerspectiveMenu'

const TitleContainer = styled(Text)`
  max-width: 100%;
  min-width: 0;
`

export const DocumentHeaderTitle = memo(function DocumentHeaderTitle(): ReactElement {
  const {connectionState, schemaType, title, value: documentValue} = useDocumentPane()
  const subscribed = Boolean(documentValue) && connectionState !== 'connecting'

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: documentValue,
  })
  const {t} = useTranslation(structureLocaleNamespace)

  if (connectionState === 'connecting') {
    return <></>
  }

  if (title) {
    return <>{title}</>
  }

  if (!documentValue) {
    return (
      <>
        {t('panes.document-header-title.new.text', {
          schemaType: schemaType?.title || schemaType?.name,
        })}
      </>
    )
  }

  if (error) {
    return <>{t('panes.document-header-title.error.text', {error: error.message})}</>
  }

  return (
    <Flex flex={1} align="center" gap={1}>
      <DocumentPerspectiveMenu />
    </Flex>
  )
})
