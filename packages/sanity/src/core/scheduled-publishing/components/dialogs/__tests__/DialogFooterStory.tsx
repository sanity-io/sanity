import {PublishIcon} from '@sanity/icons/Publish'
import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import DialogFooter from '../DialogFooter'

const NOOP = () => undefined

/**
 * Chromatic sentinel for the scheduled-publishing dialog footer after the
 * ui5 Flex migration: cancel-only, action tones, disabled, and icon. Copy
 * is hardcoded English. Shared with Storybook via a thin CSF wrapper.
 */
export function DialogFooterStory() {
  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            cancel only
          </Text>
          <DialogFooter onComplete={NOOP} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            positive action
          </Text>
          <DialogFooter buttonText="Schedule" onAction={NOOP} onComplete={NOOP} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            critical action
          </Text>
          <DialogFooter
            buttonText="Delete schedule"
            onAction={NOOP}
            onComplete={NOOP}
            tone="critical"
          />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            caution, disabled
          </Text>
          <DialogFooter
            buttonText="Schedule"
            disabled
            onAction={NOOP}
            onComplete={NOOP}
            tone="caution"
          />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            action with icon
          </Text>
          <DialogFooter
            buttonText="Publish"
            icon={PublishIcon}
            onAction={NOOP}
            onComplete={NOOP}
            tone="primary"
          />
        </VStack>
      </VStack>
    </Card>
  )
}
