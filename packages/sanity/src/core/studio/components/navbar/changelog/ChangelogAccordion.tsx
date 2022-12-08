import {ToggleArrowRightIcon} from '@sanity/icons'
import {Card, Stack, Button, Text, Code, Box} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'

const COMMANDS = ['npm install sanity@latest']

const Icon = styled(ToggleArrowRightIcon)`
  &[data-rotate='true'] {
    transform: rotate(90deg);
  }
`

interface ChangelogAccordionProps {
  defaultOpen: boolean
}

export function ChangelogAccordion(props: ChangelogAccordionProps) {
  const {defaultOpen} = props
  const [open, setOpen] = useState<boolean>(defaultOpen)

  const handleClick = useCallback(() => setOpen((v) => !v), [])

  return (
    <Card overflow="hidden">
      <Stack>
        <Button
          aria-controls="upgrade-commands"
          icon={<Icon data-rotate={open} />}
          justify="flex-start"
          mode="bleed"
          onClick={handleClick}
          padding={4}
          radius={0}
          space={2}
          text="How to upgrade"
        />
      </Stack>

      <Card
        aria-hidden={!open}
        hidden={!open}
        id="upgrade-commands"
        overflow="auto"
        paddingX={4}
        paddingY={2}
        role="region"
        tone="inherit"
      >
        <Stack space={2}>
          <Card tone="transparent" padding={3} radius={2}>
            <Stack space={3}>
              <Code language="bash" size={1}>
                {[`# Run this command to upgrade`, ...COMMANDS].join('\n')}
              </Code>
            </Stack>
          </Card>

          <Box paddingX={2} paddingY={3}>
            <Text size={1} muted>
              If you have problems upgrading, please get in touch with us in the{' '}
              <a href="https://slack.sanity.io/" rel="noopener noreferrer" target="_blank">
                Sanity Community
              </a>
              .
            </Text>
          </Box>
        </Stack>
      </Card>
    </Card>
  )
}
