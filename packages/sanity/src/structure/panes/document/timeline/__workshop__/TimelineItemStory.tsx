import {Box, Card, Container, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {type Chunk, getCalendarLabels, useDateTimeFormat, useTranslation} from 'sanity'

import {DateTimeInput} from '../../../../../ui-components/inputs/DateInputs/DateTimeInput'
import {Timeline} from '../timeline'

const CHUNKS: Chunk[] = [
  {
    index: 10,
    id: 'delete-10',
    type: 'delete',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['p8xDvUMxC']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: 9,
    id: 'unpublish-9',
    type: 'unpublish',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['p8xDvUMxC']),
    draftState: 'unknown',
    publishedState: 'present',
  },
  {
    index: 8,
    id: 'editLive-8',
    type: 'editLive',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['p8xDvUMxC']),
    draftState: 'unknown',
    publishedState: 'present',
  },
  {
    index: 7,
    id: 'discardDraft-7',
    type: 'discardDraft',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['p8xDvUMxC']),
    draftState: 'present',
    publishedState: 'present',
  },
  {
    index: 6,
    id: 'editDraft-6',
    type: 'editDraft',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['pP5s3g90N']),
    draftState: 'present',
    publishedState: 'present',
  },
  {
    index: 5,
    id: 'publish-5',
    type: 'publish',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['p8xDvUMxC']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: 4,
    id: 'editDraft-4',
    type: 'editDraft',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['pP5s3g90N']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: 3,
    id: 'editDraft-3',
    type: 'editDraft',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['pJ61yWhkD']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: 2,
    id: 'editDraft-2',
    type: 'editDraft',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['pJ61yWhkD']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: 1,
    id: 'create-1',
    type: 'create',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['p8xDvUMxC']),
    draftState: 'present',
    publishedState: 'unknown',
  },
  {
    index: 0,
    id: 'initial-0',
    type: 'initial',
    start: 0,
    end: 10,
    startTimestamp: '2024-09-02T09:28:49.734503Z',
    endTimestamp: '2024-09-02T09:28:49.734503Z',
    authors: new Set(['p8xDvUMxC']),
    draftState: 'unknown',
    publishedState: 'unknown',
  },
]

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

  const handleSelect = useCallback((chunk: Chunk) => {
    setSelected((c) => (c === chunk.id ? null : chunk.id))
  }, [])

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
          <Timeline
            chunks={CHUNKS.map((chunk) => ({...chunk, endTimestamp: date.toString()}))}
            hasMoreChunks={false}
            lastChunk={selected ? CHUNKS.find((chunk) => chunk.id === selected) : undefined}
            onSelect={handleSelect}
            onLoadMore={() => {}}
          />
        </Card>
      </Container>
    </Box>
  )
}
