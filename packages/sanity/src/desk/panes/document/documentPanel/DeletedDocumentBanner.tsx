import React, {useCallback} from 'react'
import {Button, Card, Container, Flex, Text} from '@sanity/ui'
import {ReadOnlyIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useFormState} from 'sanity/document'
import {useDocumentOperation} from 'sanity'
import {useRouter} from 'sanity/router'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`

interface DeletedDocumentBannerProps {
  revisionId?: string | null
}

export function DeletedDocumentBanner({revisionId}: DeletedDocumentBannerProps) {
  const {documentId, documentType} = useFormState()
  const {restore} = useDocumentOperation(documentId, documentType)
  const {navigateIntent} = useRouter()
  const handleRestore = useCallback(() => {
    if (revisionId) {
      restore.execute(revisionId)
      navigateIntent('edit', {id: documentId, type: documentType})
    }
  }, [documentId, documentType, navigateIntent, restore, revisionId])

  return (
    <Root data-testid="deleted-document-banner" shadow={1} tone="transparent">
      <Container paddingX={4} paddingY={revisionId ? 2 : 3} sizing="border" width={1}>
        <Flex align="center">
          <Text size={1}>
            <ReadOnlyIcon />
          </Text>

          <Flex align="center" gap={2} flex={1} marginLeft={3}>
            <Text size={1}>This document has been deleted.</Text>
            {revisionId && (
              <Button
                fontSize={1}
                padding={2}
                mode="bleed"
                tone="primary"
                onClick={handleRestore}
                text="Restore most recent version"
              />
            )}
          </Flex>
        </Flex>
      </Container>
    </Root>
  )
}
