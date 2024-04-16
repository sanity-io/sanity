import {
  // eslint-disable-next-line no-restricted-imports
  Button,
  Inline,
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
    >
      <Inline space={2}>
        <Text size={2} weight="medium">
          {SCHEDULE_STATE_DICTIONARY[state].title}
        </Text>
        {hasItems && <Text size={1}>{count}</Text>}
      </Inline>
    </Button>
  )
}

export default ScheduleFilter
