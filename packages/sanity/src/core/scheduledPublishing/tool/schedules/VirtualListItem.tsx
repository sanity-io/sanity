'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {Box, Card, Flex, Label} from '@sanity/ui'
import {type VirtualItem, type Virtualizer} from '@tanstack/react-virtual'
import {type CSSProperties, useEffect, useMemo, useState} from 'react'

import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {ScheduleItem} from '../../components/scheduleItem'
import {type Schedule} from '../../types'

export interface ListItem {
  content: Schedule | string
  key: string
  virtualRow: VirtualItem
}

interface Props {
  item: ListItem
  measureElement: Virtualizer<HTMLDivElement, Element>['measureElement']
}

/** Putting this too low will result in 429 too many requests when scrolling in big lists */
const SCHEDULE_RENDER_DELAY_MS = 200

export function VirtualListItem(props: Props) {
  const {
    item: {content, virtualRow},
    measureElement,
  } = props
  const style: CSSProperties = useMemo(
    () => ({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      transform: `translateY(${virtualRow.start}px)`,
    }),
    [virtualRow],
  )

  return (
    <Box
      data-index={virtualRow.index}
      key={virtualRow.key}
      paddingBottom={2}
      ref={measureElement}
      style={style}
    >
      {typeof content === 'string' ? (
        <MonthHeading content={content} />
      ) : (
        <DelayedScheduleItem schedule={content} />
      )}
    </Box>
  )
}

/**
 * ScheduleItem is a bit on the heavy side for rendering speed. This component defers rendering ScheduleItem
 * until "some time after" mounting, so scrolling in the virtualized Schedule-list gives better UX.
 */
function DelayedScheduleItem({schedule}: {schedule: Schedule}) {
  const [delayedScheduleItem, setDelayedScheduleItem] = useState(<PlaceholderScheduleItem />)

  useEffect(() => {
    let canUpdate = true
    const timeout = setTimeout(() => {
      if (!canUpdate) {
        return
      }
      setDelayedScheduleItem(<ScheduleItem schedule={schedule} type="tool" />)
    }, SCHEDULE_RENDER_DELAY_MS)

    return () => {
      canUpdate = false
      clearTimeout(timeout)
    }
  }, [schedule])

  return delayedScheduleItem
}

function MonthHeading({content}: {content: string}) {
  return (
    <Flex align="flex-end" paddingBottom={2} paddingTop={4}>
      <Label muted size={1}>
        {content}
      </Label>
    </Flex>
  )
}

function PlaceholderScheduleItem() {
  return (
    <Card padding={1} radius={2} shadow={1}>
      <Card padding={1}>
        <SanityDefaultPreview isPlaceholder />
      </Card>
    </Card>
  )
}
