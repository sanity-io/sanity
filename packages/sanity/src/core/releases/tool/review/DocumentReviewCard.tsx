import {CheckmarkIcon} from '@sanity/icons'
import {Button, Card, Container, Flex, Stack} from '@sanity/ui'
import {useCallback} from 'react'
import {type BundleDocument} from 'sanity'

import {DocumentReviewCardHeader} from './DocumentReviewCardHeader'

export function DocumentReviewCard(props: {
  documentId: string
  documentTypeName: string
  bundle: BundleDocument
  state?: 'ready'
  updatedAt?: string
}): JSX.Element {
  const {documentId, documentTypeName, bundle, state, updatedAt} = props

  const onHandleDiscard = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('discard')
  }, [])

  const handleOnReady = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log('onReady')
  }, [])

  return (
    <Card border overflow="hidden" radius={3}>
      <Stack>
        <DocumentReviewCardHeader
          documentId={documentId}
          documentTypeName={documentTypeName}
          releaseName={bundle.name}
        />

        <Card>
          <Container paddingX={4} paddingY={6} sizing="border" width={1}>
            Changes woop woop
            {/* 
            <DocumentChanges
              documentId={documentId}
              documentTypeName={documentTypeName}
              versionName={release.name}
            /> */}
          </Container>
        </Card>
      </Stack>

      <Flex justify="flex-end" gap={2} padding={3}>
        <Button
          disabled={
            Boolean(bundle?.archived || bundle?.publishedAt) || bundle.publishedAt !== undefined
          }
          mode="bleed"
          onClick={onHandleDiscard}
          space={2}
          padding={2}
          text="Discard"
        />

        <Button
          disabled={
            Boolean(bundle?.archived || bundle?.publishedAt) || state === 'ready' || !updatedAt
          }
          icon={CheckmarkIcon}
          onClick={handleOnReady}
          padding={2}
          space={2}
          text="Ready"
        />
      </Flex>
    </Card>
  )
}
