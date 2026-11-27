import {Stack, Switch} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Text, Box, Flex} from 'ui5'

import {HelpPopover} from './HelpPopover'

export interface SwitchFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  title: ReactNode
  description?: ReactNode
  /** The long explanation, in a help popover beside the title */
  info?: string | readonly string[]
  /** Names the help button for assistive technology */
  infoLabel?: string
  /** Linked from the help popover as "Read docs" */
  infoDocsUrl?: string
  testId?: string
  disabled?: boolean
  /** More lines under the description */
  children?: ReactNode
}

/**
 * A switch with its title and description beside it, the switch level with the title. Without a
 * description the switch, title and help button share one centre line, so a row of them lines up
 * with the inputs beside it.
 */
export function SwitchField(props: SwitchFieldProps) {
  const {checked, onChange, title, description, info, infoLabel, infoDocsUrl} = props
  const {testId, disabled, children} = props
  const singleLine = !description && !children
  return (
    // A click on the help button does not toggle the switch: a label skips activation for clicks
    // on interactive content inside it, and the popover is portaled out of the label
    <Flex alignItems={singleLine ? 'center' : 'flex-start'} as="label" gap={2}>
      {/* A ui5 box has no minimum width, so a long description would squeeze it and run over the
          switch. As a flex container it drops the line box an inline switch would sit on, which
          would leave room for descenders under it and push it off the centre line. */}
      <Flex flexShrink={0} paddingTop={singleLine ? 0 : 1}>
        <Switch
          checked={checked}
          data-testid={testId}
          disabled={disabled}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
      </Flex>
      <Stack gap={2}>
        <Flex alignItems="center" gap={1}>
          <Text size={1} weight="medium" as="div" trim={true}>
            {title}
          </Text>
          {info && (
            // The help button fills its container, so unwrapped it would take half the row and
            // wrap the title
            <Flex flexShrink={0}>
              <HelpPopover
                content={info}
                docsUrl={infoDocsUrl}
                label={infoLabel ?? (typeof title === 'string' ? title : '')}
                testId={testId ? `${testId}-info` : undefined}
              />
            </Flex>
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
