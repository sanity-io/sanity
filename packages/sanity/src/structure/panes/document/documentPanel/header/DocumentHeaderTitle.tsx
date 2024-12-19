import {DocumentIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {memo, type ReactElement} from 'react'
import {unstable_useValuePreview as useValuePreview, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentPerspectiveList} from './perspective/DocumentPerspectiveList'

const TitleContainer = styled(Text)`
  max-width: 100%;
  min-width: 0;
`

export const DocumentHeaderTitle = memo(function DocumentHeaderTitle(props: {
  collapsed?: boolean
}): ReactElement {
  const {collapsed = false} = props
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

  const Icon = schemaType?.options?.icon || DocumentIcon

  return (
    <Flex flex={1} align="center" gap={collapsed ? 3 : 1} paddingX={collapsed ? 2 : 0}>
      {collapsed ? (
        <>
          <Text size={1}>
            <Icon />
          </Text>
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
        </>
      ) : (
        <DocumentPerspectiveList />
      )}
    </Flex>
  )
})
