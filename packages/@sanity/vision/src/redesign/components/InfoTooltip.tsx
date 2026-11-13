import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Stack} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {Box, PressArea, Text} from 'ui5'

interface InfoTooltipProps {
  /** The explanation, one paragraph per entry */
  content: string | readonly string[]
  /** Names the button for assistive technology */
  label: string
  testId?: string
}

/** An info icon that explains the field next to it in a tooltip */
export function InfoTooltip({content, label, testId}: InfoTooltipProps) {
  const paragraphs = typeof content === 'string' ? [content] : content
  return (
    <Tooltip
      animate
      content={
        <Box data-testid={testId ? `${testId}-content` : undefined} style={{maxWidth: 320}}>
          <Stack gap={3}>
            {paragraphs.map((paragraph) => (
              <Text key={paragraph} size={1} as="p">
                {paragraph}
              </Text>
            ))}
          </Stack>
        </Box>
      }
      placement="top"
      portal
    >
      <PressArea aria-label={label} data-testid={testId} type="button">
        <Text muted size={1}>
          <InfoOutlineIcon />
        </Text>
      </PressArea>
    </Tooltip>
  )
}
