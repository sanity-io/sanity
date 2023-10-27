import React, {useCallback} from 'react'
import {Button, Card, Container, Flex, Text} from '@sanity/ui'
import {ReadOnlyIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {useDocumentOperation, useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'
import {deskLocaleNamespace} from '../../../i18n'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`

interface DeletedDocumentBannerProps {
  revisionId?: string | null
}

export function DeletedDocumentBanner({revisionId}: DeletedDocumentBannerProps) {
  const {documentId, documentType} = useDocumentPane()
  const {restore} = useDocumentOperation(documentId, documentType)
  const {navigateIntent} = useRouter()
  const handleRestore = useCallback(() => {
    if (revisionId) {
      restore.execute(revisionId)
      navigateIntent('edit', {id: documentId, type: documentType})
    }
  }, [documentId, documentType, navigateIntent, restore, revisionId])
  const {t} = useTranslation(deskLocaleNamespace)

  return (
    <Root data-testid="deleted-document-banner" shadow={1} tone="transparent">
      <Container paddingX={4} paddingY={revisionId ? 2 : 3} sizing="border" width={1}>
        <Flex align="center">
          <Text size={1}>
            <ReadOnlyIcon />
          </Text>

          <Flex align="center" gap={2} flex={1} marginLeft={3}>
            <Text size={1}>{t('banners.deleted-document-banner.text')}</Text>
            {revisionId && (
              <Button
                fontSize={1}
                padding={2}
                mode="bleed"
                tone="primary"
                onClick={handleRestore}
                text={t('banners.deleted-document-banner.restore-button.text')}
              />
            )}
          </Flex>
        </Flex>
      </Container>
    </Root>
  )
}
