import {EditIcon, PublishIcon} from '@sanity/icons'
import {Container, Flex} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React from 'react'
import {DocumentPreviewPresence} from '../../../presence'
import {TextWithTone} from '../../textWithTone'
import {PreviewCard} from '../PreviewCard'

export default function PreviewCardStory() {
  const selected = useBoolean('Selected', true)

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={0}>
        <PreviewCard as="button" paddingY={2} paddingX={3} radius={2} selected={selected}>
          <Flex align="center" justify="center" gap={4}>
            <DocumentPreviewPresence
              presence={['id-1', 'id-2', 'id-3', 'id-4'].map(
                (num) =>
                  ({
                    status: 'online',
                    lastActiveAt: '',
                    user: {
                      imageUrl: 'https://source.unsplash.com/96x96/?face',
                      id: num,
                    },
                  }) as any,
              )}
            />
            <TextWithTone tone="positive">
              <PublishIcon />
            </TextWithTone>
            <TextWithTone tone="caution">
              <EditIcon />
            </TextWithTone>
          </Flex>
        </PreviewCard>
      </Container>
    </Flex>
  )
}
