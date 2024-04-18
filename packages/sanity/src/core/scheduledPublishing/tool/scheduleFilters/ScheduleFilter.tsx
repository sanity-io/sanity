import {
  // eslint-disable-next-line no-restricted-imports
  Button,
  Flex,
  Text,
} from '@sanity/ui'
import {useStateLink} from 'sanity/router'

import {SCHEDULE_STATE_DICTIONARY} from '../../constants'
import {useFilteredSchedules} from '../../hooks/useFilteredSchedules'
import {type Schedule, type ScheduleState} from '../../types'

interface Props {
  schedules: Schedule[]
  selected?: boolean
  state: ScheduleState
}

const ScheduleFilter = (props: Props) => {
  const {selected, schedules, state} = props

  const count = useFilteredSchedules(schedules, state).length

  const hasItems = count > 0

  const critical = state === 'cancelled'

  const {href, onClick} = useStateLink({
    state: {state},
  })

  return (
    <Button
      as="a"
      href={href}
      mode="bleed"
      onClick={onClick}
      selected={selected}
      tone={critical ? 'critical' : 'default'}
      padding={2}
    >
      <Flex gap={2} align={'center'}>
        <Text size={1} weight="medium">
          {SCHEDULE_STATE_DICTIONARY[state].title}
        </Text>
        {hasItems && <Text size={0}>{count}</Text>}
      </Flex>
    </Button>
  )
}

export default ScheduleFilter
