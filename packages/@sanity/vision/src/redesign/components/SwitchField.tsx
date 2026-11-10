import {Stack, Switch} from '@sanity/ui'
import {type ReactNode} from 'react'
import {Text, Box, Flex} from 'ui5'

export interface SwitchFieldProps {
  checked: boolean
  onChange: (checked: boolean) => void
  title: ReactNode
  description: ReactNode
  testId?: string
  /** More lines under the description */
  children?: ReactNode
}

/** A switch with its title and description beside it, the switch level with the title */
export function SwitchField(props: SwitchFieldProps) {
  const {checked, onChange, title, description, testId, children} = props
  return (
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
        <Text size={1} weight="medium" as="div" trim={true}>
          {title}
        </Text>
        <Text muted size={1} as="div" trim={true}>
          {description}
        </Text>
        {children}
      </Stack>
    </Flex>
  )
}
