import {InfoOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Grid, Stack} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React from 'react'
import {TextWithTone} from '../TextWithTone'

const TEXT_SIZE_OPTIONS = {'0': 0, '1': 1, '2': 2, '3': 3, '4': 4}

const CARD_TONE_OPTIONS = {
  Default: 'default',
  Primary: 'primary',
  Positive: 'positive',
  Caution: 'caution',
  Critical: 'critical',
} as const

const tones = ['default', 'primary', 'positive', 'caution', 'critical']

export default function TextWithToneStory() {
  const size = useSelect('Size', TEXT_SIZE_OPTIONS, 2)
  const dimmed = useBoolean('Dimmed', false)
  const muted = useBoolean('Muted', false)
  const cardTone = useSelect('Card tone', CARD_TONE_OPTIONS)

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Grid columns={2}>
        <Card padding={4} border radius={2} tone={cardTone}>
          <Stack space={3}>
            {tones.map((tone) => (
              <TextWithTone key={tone} size={size} dimmed={dimmed} muted={muted} tone={tone as any}>
                <Flex align="center" gap={2}>
                  <InfoOutlineIcon />
                  {tone}
                </Flex>
              </TextWithTone>
            ))}
          </Stack>
        </Card>
        <Box padding={4}>
          <Stack space={3}>
            {tones.map((tone) => (
              <TextWithTone key={tone} size={size} dimmed={dimmed} muted={muted} tone={tone as any}>
                <Flex align="center" gap={2}>
                  <InfoOutlineIcon />
                  {tone}
                </Flex>
              </TextWithTone>
            ))}
          </Stack>
        </Box>
      </Grid>
    </Flex>
  )
}
