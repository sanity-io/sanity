import {Box, Card, Container, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {type ChunkType, getCalendarLabels, useDateTimeFormat, useTranslation} from 'sanity'

import {DateTimeInput} from '../../../../../ui-components/inputs/DateInputs/DateTimeInput'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from '../timelineI18n'
import {TimelineItem} from '../timelineItem'

const CHUNK_TYPES = Object.keys(TIMELINE_ITEM_I18N_KEY_MAPPING).reverse() as ChunkType[]

export default function TimelineItemStory() {
  const {t: coreT} = useTranslation()
  const [date, setDate] = useState<Date>(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)
  const dateFormatter = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
  const calendarLabels = useMemo(() => getCalendarLabels(coreT), [coreT])

  const inputValue = date ? dateFormatter.format(new Date(date)) : ''
  const handleDatechange = (newDate: Date | null) => {
    if (newDate) {
      setDate(newDate)
    } else {
      console.error('No date selected')
    }
  }

  return (
    <Box margin={3}>
      <Container width={0} margin={4}>
        <Box paddingY={3}>
          <Text as="h2" size={2} weight="semibold">
            Timeline Item
          </Text>
        </Box>
        <Stack space={2} marginTop={3}>
          <Text weight="medium" as="label" htmlFor="date" size={1}>
            Select date:
          </Text>
          <DateTimeInput
            id="date"
            selectTime
            onChange={handleDatechange}
            calendarLabels={calendarLabels}
            value={date ? new Date(date) : undefined}
            inputValue={inputValue}
            constrainSize={false}
          />
          <Text size={0} muted>
            Update the selected date to see how the component behaves with relative dates.
          </Text>
        </Stack>

        <Card border padding={2} marginTop={3} radius={2}>
          <Stack space={1}>
            {CHUNK_TYPES.map((key, index) => (
              <TimelineItem
                key={key}
                onSelect={() => setSelected((p) => (p === key ? null : key))}
                isSelected={selected === key}
                type={key}
                timestamp={date.toString()}
                chunk={{
                  index,
                  id: key,
                  type: key,
                  start: -13,
                  end: -13,
                  startTimestamp: date.toString(),
                  endTimestamp: date.toString(),
                  authors: new Set(['p8xDvUMxC']),
                  draftState: 'unknown',
                  publishedState: 'present',
                }}
                squashedChunks={
                  key === 'publish'
                    ? [
                        {
                          index: 0,
                          id: '123',
                          type: 'editDraft',
                          start: 0,
                          end: 0,
                          startTimestamp: date.toString(),
                          endTimestamp: date.toString(),
                          authors: new Set(['pP5s3g90N']),
                          draftState: 'present',
                          publishedState: 'present',
                        },
                        {
                          index: 1,
                          id: '345',
                          type: 'editDraft',
                          start: 1,
                          end: 1,
                          startTimestamp: date.toString(),
                          endTimestamp: date.toString(),
                          authors: new Set(['pJ61yWhkD']),
                          draftState: 'present',
                          publishedState: 'present',
                        },
                        {
                          index: 2,
                          id: '345',
                          type: 'editDraft',
                          start: 2,
                          end: 2,
                          startTimestamp: date.toString(),
                          endTimestamp: date.toString(),
                          authors: new Set(['pJ61yWhkD']),
                          draftState: 'present',
                          publishedState: 'present',
                        },
                      ]
                    : undefined
                }
              />
            ))}
          </Stack>
        </Card>
      </Container>
    </Box>
  )
}
