import {DocumentIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {createElement, memo, type ReactElement} from 'react'
import {unstable_useValuePreview as useValuePreview, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentPerspectiveMenu} from './perspective/DocumentPerspectiveMenu'

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
    <Flex flex="none" gap={3} paddingX={2} style={{flex: 1, alignItems: 'center'}}>
      <Text size={1}>{createElement(schemaType?.options?.icon || DocumentIcon)}</Text>
      <Text
        muted={!value?.title}
        size={1}
        textOverflow="ellipsis"
        weight={value?.title ? 'semibold' : undefined}
        style={{maxWidth: '100%', minWidth: '0'}}
        title={value?.title}
      >
        {value?.title || (
          <span style={{color: 'var(--card-muted-fg-color)'}}>
            {t('panes.document-header-title.untitled.text')}
          </span>
        )}
      </Text>
      <Flex flex="none" gap={1}>
        <DocumentPerspectiveMenu />
      </Flex>
    </Flex>
  )
})
