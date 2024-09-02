import {Box, Card, Container, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {
  type Chunk,
  type ChunkType,
  getCalendarLabels,
  useDateTimeFormat,
  useTranslation,
} from 'sanity'

import {DateTimeInput} from '../../../../../ui-components/inputs/DateInputs/DateTimeInput'
import {ExpandableTimelineItem} from '../expandableTimelineItem'
import {TIMELINE_ITEM_I18N_KEY_MAPPING} from '../timelineI18n'
import {TimelineItem} from '../timelineItem'

const CHUNK_TYPES = Object.keys(TIMELINE_ITEM_I18N_KEY_MAPPING).reverse() as ChunkType[]

function createChunk(type: ChunkType, index: number, date: Date): Chunk {
  return {
    index,
    id: type,
    type: type,
    start: -13,
    end: -13,
    startTimestamp: date.toString(),
    endTimestamp: date.toString(),
    authors: new Set(['p8xDvUMxC']),
    draftState: 'unknown',
    publishedState: 'present',
  }
}
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
          <Stack space={1}>
            {CHUNK_TYPES.map((type, index) => {
              if (type === 'publish') {
                return (
                  <ExpandableTimelineItem
                    key={type}
                    chunk={createChunk(type, index, date)}
                    onSelect={handleSelect}
                    squashedChunks={[
                      {
                        ...createChunk('editDraft', 0, date),
                        authors: new Set(['pP5s3g90N']),
                      },
                      {
                        ...createChunk('editDraft', 1, date),
                        authors: new Set(['pJ61yWhkD']),
                      },
                      {
                        ...createChunk('editDraft', 2, date),
                        authors: new Set(['pJ61yWhkD']),
                      },
                    ]}
                  />
                )
              }
              return (
                <TimelineItem
                  key={type}
                  onSelect={handleSelect}
                  isSelected={selected === type}
                  type={type}
                  timestamp={date.toString()}
                  chunk={createChunk(type, index, date)}
                />
              )
            })}
          </Stack>
        </Card>
      </Container>
    </Box>
  )
}
