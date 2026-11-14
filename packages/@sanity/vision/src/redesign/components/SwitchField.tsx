import {Stack, Switch} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Text, Box, Flex} from 'ui5'

import {InfoTooltip} from './InfoTooltip'

export interface SwitchFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** The long explanation, behind an info icon beside the title */
  info?: string | readonly string[]
  /** Names the info icon for assistive technology */
  infoLabel?: string
  testId?: string
  /** More lines under the description */
  children?: ReactNode
}

/** A switch with its title and description beside it, the switch level with the title */
export function SwitchField(props: SwitchFieldProps) {
  const {checked, onChange, title, description, info, infoLabel, testId, children} = props
  return (
    // A click on the info button does not toggle the switch: a label skips activation for clicks
    // on interactive content inside it
    <Flex alignItems="flex-start" as="label" gap={3}>
      {/* A ui5 box has no minimum width, so a long description would squeeze it and run over the
          switch */}
      <Box flexShrink={0} paddingTop={1}>
        <Switch
          checked={checked}
          data-testid={testId}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
      </Box>
      <Stack gap={2}>
        <Flex alignItems="center" gap={1}>
          <Text size={1} weight="medium" as="div" trim={true}>
            {title}
          </Text>
          {info && (
            <InfoTooltip
              content={info}
              label={infoLabel ?? (typeof title === 'string' ? title : '')}
              testId={testId ? `${testId}-info` : undefined}
            />
          )}
        </Flex>
        {description && (
          <Text muted size={1} as="div" trim={true}>
            {description}
          </Text>
        )}
        {children}
      </Stack>
    </Flex>
  )
}
