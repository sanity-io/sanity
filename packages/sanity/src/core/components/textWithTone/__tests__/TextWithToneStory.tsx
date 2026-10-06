import {type ButtonTone, Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {TextWithTone} from '../TextWithTone'

const TONES: ButtonTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

/**
 * Chromatic sentinel for the studio TextWithTone wrapper around `@sanity/ui`
 * Text. Badge-token foregrounds and the dimmed/muted overrides are what a
 * ui5 Text swap would drift; TypeScript will not catch that.
 */
export function TextWithToneStory() {
  return (
    <Card padding={4}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            tones
          </Text>
          <Flex gap={4} flexWrap="wrap">
            {TONES.map((tone) => (
              <TextWithTone key={tone} size={1} tone={tone}>
                {tone}
              </TextWithTone>
            ))}
          </Flex>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            dimmed
          </Text>
          <Flex gap={4} flexWrap="wrap">
            {TONES.map((tone) => (
              <TextWithTone key={`${tone}-dimmed`} dimmed size={1} tone={tone}>
                {tone}
              </TextWithTone>
            ))}
          </Flex>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            muted (skips tone tokens)
          </Text>
          <Flex gap={4} flexWrap="wrap">
            {TONES.map((tone) => (
              <TextWithTone key={`${tone}-muted`} muted size={1} tone={tone}>
                {tone}
              </TextWithTone>
            ))}
          </Flex>
        </VStack>
      </VStack>
    </Card>
  )
}
