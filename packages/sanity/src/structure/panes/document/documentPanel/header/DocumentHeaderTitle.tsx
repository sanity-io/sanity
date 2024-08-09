import {DocumentIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {createElement, type ReactElement} from 'react'
import {unstable_useValuePreview as useValuePreview} from 'sanity'

import {useTranslation} from '../../../../../core/i18n'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentPerspectiveMenu} from './perspective/DocumentPerspectiveMenu'

export function DocumentHeaderTitle(): ReactElement {
  const {documentId, connectionState, schemaType, title, value: documentValue} = useDocumentPane()
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
    <Flex flex={1} gap={0}>
      <Flex flex="none" gap={3} padding={2}>
        <Text size={1}>{createElement(schemaType?.options?.icon || DocumentIcon)}</Text>
        <Text
          muted={!value?.title}
          size={1}
          textOverflow="ellipsis"
          weight={value?.title ? 'semibold' : undefined}
        >
          {value?.title || (
            <span style={{color: 'var(--card-muted-fg-color)'}}>
              {t('panes.document-header-title.untitled.text')}
            </span>
          )}
        </Text>
      </Flex>

      <Flex flex="none" gap={1}>
        <DocumentPerspectiveMenu documentId={documentId} />
      </Flex>
    </Flex>
  )
}
