import {Flex, Stack, Text, Card, CardProps} from '@sanity/ui'
import styled from 'styled-components'
import {useMemo} from 'react'
import {CalendarIcon} from '@sanity/icons'
import {useDateTimeFormat} from 'sanity'

interface TasksListItemProps {
  title?: string
  dueBy?: string
  onSelect: () => void
}

export const ThreadCard = styled(Card).attrs<CardProps>(({tone}) => ({
  padding: 3,
  radius: 3,
  sizing: 'border',
  tone: tone || 'transparent',
}))<CardProps>`
  // ...
`

const Title = styled(Text)`
  :hover {
    text-decoration: underline;
  }
`
/**
 * @internal
 */
export function TasksListItem({title, dueBy, onSelect}: TasksListItemProps) {
  const dateFormatter = useDateTimeFormat({
    dateStyle: 'medium',
  })
  const dueByeDisplayValue = useMemo<string | undefined>(() => {
    return dueBy ? dateFormatter.format(new Date(dueBy)) : undefined
  }, [dateFormatter, dueBy])

  return (
    <ThreadCard tone={undefined}>
      <Stack space={2}>
        <Title size={1} weight="semibold" onClick={onSelect}>
          {title || 'Untitled'}
        </Title>
        {dueByeDisplayValue && (
          <Flex align="center" gap={1}>
            <CalendarIcon />
            <Text size={1} muted>
              {dueByeDisplayValue}
            </Text>
          </Flex>
        )}
      </Stack>
    </ThreadCard>
  )
}
