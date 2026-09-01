import {Card, Text} from '@sanity/ui'
import {type ComponentType} from 'react'
import {Flex, Box} from 'ui5'

interface ConditionOptionCardProps {
  description?: string
  icon?: ComponentType
  onClick: () => void
  selected?: boolean
  testId?: string
  title: string
}

export function ConditionOptionCard(props: ConditionOptionCardProps): React.JSX.Element {
  const {description, icon: Icon, onClick, selected = false, testId, title} = props

  return (
    <Card
      aria-label={title}
      aria-pressed={selected}
      as="button"
      type="button"
      data-testid={testId}
      onClick={onClick}
      padding={3}
      radius={2}
      selected={selected}
      style={{textAlign: 'left', width: '100%'}}
      tone={selected ? 'primary' : undefined}
    >
      <Flex alignItems="flex-start" gap={3}>
        {Icon ? (
          <Box>
            <Text size={1}>
              <Icon />
            </Text>
          </Box>
        ) : null}
        <Box flexGrow={1} style={{minWidth: 0}}>
          <Text size={1} weight="medium">
            {title}
          </Text>
          {description ? (
            <Box paddingTop={2}>
              <Text muted size={1}>
                {description}
              </Text>
            </Box>
          ) : null}
        </Box>
      </Flex>
    </Card>
  )
}
