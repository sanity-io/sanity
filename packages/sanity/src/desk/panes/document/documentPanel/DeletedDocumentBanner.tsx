import React, {useCallback, useMemo} from 'react'
import {Button, Card, Container, Flex, Text} from '@sanity/ui'
import {ReadOnlyIcon} from '@sanity/icons'
import styled from 'styled-components'
import {useDocumentPane} from '../useDocumentPane'
import {useDocumentOperation, useTimelineSelector} from 'sanity'

const Root = styled(Card)`
  position: relative;
  z-index: 50;
`
export function DeletedDocumentBanner() {
  const {documentId, documentType, timelineStore} = useDocumentPane()
  const chunks = useTimelineSelector(timelineStore, (state) => state.chunks)
  const lastRevisionId = useMemo(() => {
    const lastRevision = chunks.filter((chunk) => !['delete', 'initial'].includes(chunk.type))

    return lastRevision?.[0]?.id
  }, [chunks])
  const {restore} = useDocumentOperation(documentId, documentType)
  const handleRestore = useCallback(() => {
    restore.execute(lastRevisionId)
  }, [restore, lastRevisionId])

  return (
    <Root data-testid="deleted-document-banner" shadow={1} tone="transparent">
      <Container paddingX={4} paddingY={lastRevisionId ? 2 : 3} sizing="border" width={1}>
        <Flex align="center">
          <Text size={1}>
            <ReadOnlyIcon />
          </Text>

          <Flex align="center" gap={2} flex={1} marginLeft={3}>
            <Text size={1}>This document is deleted and can’t be edited.</Text>
            {lastRevisionId && (
              <Button
                radius={0}
                fontSize={1}
                padding={2}
                mode="bleed"
                tone="primary"
                onClick={handleRestore}
                text={'Restore most recent vision'}
              />
            )}
          </Flex>
        </Flex>
      </Container>
    </Root>
  )
}
