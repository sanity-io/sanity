import {DocumentIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {createElement, memo, type ReactElement} from 'react'
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
  const subscribed = Boolean(documentValue)

  const {error, value} = useValuePreview({
    enabled: subscribed,
    schemaType,
    value: documentValue,
  })
  const {t} = useTranslation(structureLocaleNamespace)

  if (connectionState === 'connecting' && !subscribed) {
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
    <Flex flex={1} align="center" gap={3} paddingX={2}>
      <Text size={1}>{createElement(schemaType?.options?.icon || DocumentIcon)}</Text>
      <TitleContainer
        muted={!value?.title}
        size={1}
        textOverflow="ellipsis"
        weight={value?.title ? 'semibold' : undefined}
        title={value?.title}
      >
        {value?.title || (
          <span style={{color: 'var(--card-muted-fg-color)'}}>
            {t('panes.document-header-title.untitled.text')}
          </span>
        )}
      </TitleContainer>
      <Flex flex="none" align="center" gap={1}>
        <DocumentPerspectiveMenu />
      </Flex>
    </Flex>
  )
})
